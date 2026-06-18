export enum HardwareLevel {
    STAGE_A_PREMIUM = "STAGE_A_PREMIUM",
    STAGE_B_STANDARD = "STAGE_B_STANDARD",
    STAGE_C_FALLBACK = "STAGE_C_FALLBACK"
}

export interface DeviceCapabilities {
    webgpu: boolean;
    webgl2: boolean;
    webgl1: boolean;
    wasm: boolean;
}

export interface DispatchRoute {
    level: HardwareLevel;
    decodePipeline: 'WASM_SIMD' | 'WORKER_BITWISE' | 'MAIN_SYNC';
    renderPipeline: 'WEBGPU_COMPUTE' | 'WEBGL_SHADER' | 'CANVAS_2D';
}

export class TasteDispatcher {
    private caps: DeviceCapabilities | null = null;
    private assignedRoute: DispatchRoute | null = null;

    async sniffCapabilities(): Promise<DeviceCapabilities> {
        if (this.caps) return this.caps;

        const caps: DeviceCapabilities = {
            webgpu: false,
            webgl2: false,
            webgl1: false,
            wasm: false,
        };

        if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
            try {
                const adapter = await (navigator as any).gpu.requestAdapter();
                if (adapter) caps.webgpu = true;
            } catch { /* unsupported */ }
        }

        if (typeof document !== 'undefined') {
            try {
                const canvas = document.createElement('canvas');
                if (canvas.getContext('webgl2')) caps.webgl2 = true;
                else if (canvas.getContext('webgl')) caps.webgl1 = true;
            } catch { /* unsupported */ }
        }

        if (typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function') {
            caps.wasm = true;
        }

        this.caps = caps;
        return caps;
    }

    async resolveRoute(): Promise<DispatchRoute> {
        if (this.assignedRoute) return this.assignedRoute;

        const caps = await this.sniffCapabilities();

        if (caps.wasm && caps.webgpu) {
            this.assignedRoute = {
                level: HardwareLevel.STAGE_A_PREMIUM,
                decodePipeline: 'WASM_SIMD',
                renderPipeline: 'WEBGPU_COMPUTE',
            };
        } else if (caps.webgl2 || caps.webgl1) {
            this.assignedRoute = {
                level: HardwareLevel.STAGE_B_STANDARD,
                decodePipeline: caps.wasm ? 'WASM_SIMD' : 'WORKER_BITWISE',
                renderPipeline: 'WEBGL_SHADER',
            };
        } else {
            this.assignedRoute = {
                level: HardwareLevel.STAGE_C_FALLBACK,
                decodePipeline: 'MAIN_SYNC',
                renderPipeline: 'CANVAS_2D',
            };
        }

        this.logDispatcherTelemetry(this.assignedRoute);
        return this.assignedRoute;
    }

    private logDispatcherTelemetry(route: DispatchRoute): void {
        console.log(`%c[X-Taste Dispatcher Telemetry]`, "color: #1DA1F2; font-weight: bold;");
        console.log(` -> 檢測完成！硬體指派等級 : ${route.level}`);
        console.log(` -> 解碼管線路由 (Decode)  : ${route.decodePipeline}`);
        console.log(` -> 渲染管線路由 (Render)  : ${route.renderPipeline}`);

        if (route.level === HardwareLevel.STAGE_C_FALLBACK) {
            console.warn("[⚠️ Warning] 裝置硬體過於老舊或瀏覽器限制，X-Taste 已自動啟動『脫水降級保護機制』以防止介面死鎖。");
        } else {
            console.log("%c[✓ Success] 核心防護就位，主執行緒非阻塞屏障已成功建立。", "color: #4BB543;");
        }
    }
}
