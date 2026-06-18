import initWasm, { taste_wasm_self_heal } from './wasm_generated/xtaste_core.js';

export async function initializeTasteSDK() {
    // 1. 初始化並加載 Wasm 二進位核心
    await initWasm();
    console.log("[LibTaste] WebAssembly 128-bit 矩陣安全核心加載成功。");
}

export function repairReceivedPacket(corruptedBuffer: Uint8Array, errorType: number): Uint8Array {
    try {
        // 2. 直接將前端的 Uint8Array 記憶體指針丟給 Wasm 核心，0 延遲無損召回
        const repairedVector = taste_wasm_self_heal(corruptedBuffer, errorType);
        return new Uint8Array(repairedVector);
    } catch (error) {
        console.error("[LibTaste Error] 本地端自主修補失敗，退化至傳統流程:", error);
        return corruptedBuffer;
    }
}

// ── Core Protocol ──────────────────────────────────────────────────────
export { TasteMatrix, Field } from './core/matrix.js';
export type { MatrixBuffer } from './core/matrix.js';
export { TasteEncoder } from './core/encoder.js';
export type { RawPostData } from './core/encoder.js';
export { TasteDecoder } from './core/decoder.js';
export type { PreviewCard } from './core/decoder.js';
export { TasteSecurity, CorruptedField } from './core/security.js';
export { InteractionBitmask, Mask } from './core/bitmask.js';
export type { SocialState } from './core/bitmask.js';

// ── Client Runtime ─────────────────────────────────────────────────────
export { TasteDispatcher, HardwareLevel } from './dispatcher.js';
export type { DeviceCapabilities, DispatchRoute } from './dispatcher.js';
export { TasteWorkerPool } from './worker_pool.js';
export type { DecodeTask } from './worker_pool.js';
