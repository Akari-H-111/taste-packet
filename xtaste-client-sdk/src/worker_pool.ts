/**
 * @file worker_pool.ts
 * @description X-Taste 前端多執行緒 Web Worker 排隊與背壓控制緩衝池
 * @version 1.0.0
 * @license MIT
 *
 * 設計哲學遵循 Unix 哲學：做好並行調度這一件事，將主執行緒從解碼算力中完全解放。
 */

export interface DecodeTask {
    id: string;               // 推文唯一的 Tweet ID
    packet: Uint8Array;       // 16 位元組的原始二進位流
    errorType: number;        // 損壞類型：1 = 視覺色C損壞, 2 = 社交Bitmask損壞
    resolve: (repaired: Uint8Array) => void;
    reject: (err: any) => void;
}

export class TasteWorkerPool {
    private poolSize: number;
    private workers: Worker[] = [];
    private workerBusyStatus: boolean[] = []; // 追蹤每個 Worker 的忙碌狀態
    private taskQueue: DecodeTask[] = [];     // 核心：工作排隊佇列
    private maxQueueSize: number = 200;       // 背壓閥門：佇列最大容納上限

    /**
     * @param poolSize 執行緒池大小。建議依據 Dispatcher 判定：低階手機設 2，高階設 4 或 navigator.hardwareConcurrency
     */
    constructor(poolSize: number = 2) {
        this.poolSize = Math.max(1, poolSize);
        this.initializePool();
    }

    /**
     * 🏗️ 初始化執行緒池並注入 Web Worker 運行腳本
     */
    private initializePool(): void {
        // 使用 Blob 動態生成內聯 Web Worker，免去配置額外實體檔案的麻煩
        const workerCode = `
            import initWasm, { taste_wasm_self_heal } from './wasm_generated/xtaste_core.js';

            let wasmInitialized = false;

            self.onmessage = async (e) => {
                const { taskId, packet, errorType } = e.data;

                // 延遲懶加載：只有當 Worker 第一次分配到工作時才初始化 Wasm 核心
                if (!wasmInitialized) {
                    await initWasm();
                    wasmInitialized = true;
                }

                try {
                    // 呼叫 Rust Wasm 核心進行暫存器級別的 XOR 容錯召回
                    const repairedVec = taste_wasm_self_heal(packet, errorType);
                    const repairedArray = new Uint8Array(repairedVec);

                    // 利用 Transferable Objects 將記憶體所有權移轉回主執行緒，開銷為 0
                    self.postMessage({ taskId, repaired: repairedArray, success: true }, [repairedArray.buffer]);
                } catch (err) {
                    self.postMessage({ taskId, error: err.toString(), success: false });
                }
            };
        `;

        // Note: In an actual production setup using bundlers (Vite/Webpack),
        // inner imports inside Blob URLs might need to be resolved correctly.
        // For demonstration of the original design, we keep the Blob URL approach.
        if (typeof window !== 'undefined' && typeof Blob !== 'undefined') {
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);

            for (let i = 0; i < this.poolSize; i++) {
                const worker = new Worker(workerUrl, { type: 'module' });

                worker.onmessage = (e) => {
                    this.handleWorkerMessage(i, e.data);
                };

                this.workers.push(worker);
                this.workerBusyStatus.push(false); // 初始狀態皆為閒置
            }
        }
    }

    /**
     * 📥 外部呼叫介面：將推文解碼任務排入佇列 (Push Task into Queue)
     */
    public decodePacketAsync(id: string, packet: Uint8Array, errorType: number): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {

            // 🚨 背壓控制 (Backpressure Relief)：如果用戶刷得太瘋狂，佇列已滿
            if (this.taskQueue.length >= this.maxQueueSize) {
                // 丟棄最舊的預覽任務（因為用戶已經滑過去了），防止記憶體溢出
                const droppedTask = this.taskQueue.shift();
                if (droppedTask) {
                    droppedTask.reject(new Error("[LibTaste Backpressure] 佇列過載，拋棄過期卡片任務"));
                }
            }

            // 新任務入隊
            this.taskQueue.push({ id, packet, errorType, resolve, reject });

            // 驅動執行緒池開始運轉
            this.executeNext();
        });
    }

    /**
     * ⚙️ 核心調度發動機：有條不紊地分配任務 (Scheduler Engine)
     */
    private executeNext(): void {
        if (this.taskQueue.length === 0) return;

        // 尋找當前閒置的 Worker
        const idleWorkerIndex = this.workerBusyStatus.findIndex(busy => !busy);
        if (idleWorkerIndex === -1) {
            // 所有 Worker 都在爆滿運算中，任務乖乖在佇列排隊，成功保護主執行緒不卡死
            return;
        }

        const task = this.taskQueue.shift()!;
        this.workerBusyStatus[idleWorkerIndex] = true; // 標記為忙碌

        // 🚀 關鍵優化：利用 Transferable 把 packet.buffer 的所有權直接剝離給 Worker
        // 主執行緒不再持有此記憶體，徹底免去二進位複製開銷
        this.workers[idleWorkerIndex].postMessage({
            taskId: task.id,
            packet: task.packet,
            errorType: task.errorType
        }, [task.packet.buffer]);

        // 儲存任務承諾（Promise）的上下文，以便 Worker 回傳時對接
        (this.workers[idleWorkerIndex] as any).currentTask = task;
    }

    /**
     * 📥 接收 Worker 運算完畢的通知 (Worker Callback)
     */
    private handleWorkerMessage(workerIndex: number, data: any): void {
        const worker = this.workers[workerIndex] as any;
        const task: DecodeTask = worker.currentTask;

        // 釋放 Worker 狀態，使其重回閒置
        this.workerBusyStatus[workerIndex] = false;

        if (data.success) {
            // 完美召回，將 100% 正確的 16 位元組交還給前端渲染層
            task.resolve(data.repaired);
        } else {
            task.reject(data.error);
        }

        // 繼續清空剩餘的排隊佇列
        this.executeNext();
    }

    /**
     * ☠️ 銷毀執行緒池
     */
    public terminate(): void {
        this.workers.forEach(w => w.terminate());
        this.taskQueue = [];
        console.log("[LibTaste WorkerPool] 執行緒池已安全卸載關閉。");
    }
}
