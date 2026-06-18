/**
 * @file lib.rs
 * @description X-Taste 核心 WebAssembly JavaScript 膠水層介面
 */

use wasm_bindgen::prelude::*;

pub mod security;
use security::{TasteSecurity, CorruptedField};

/// 讓 JS 能夠直接呼叫的 Wasm 自主修補接口
/// @param js_matrix 傳入前端的 Uint8Array (必須為 16 位元組)
/// @param error_type 損壞類型：1 = 視覺色C損壞, 2 = 社交Bitmask損壞
#[wasm_bindgen]
pub fn taste_wasm_self_heal(js_matrix: &mut [u8], error_type: u8) -> Result<Vec<u8>, JsValue> {
    if js_matrix.len() != 16 {
        return Err(JsValue::from_str("X-Taste 矩陣長度必須嚴格等於 16 位元組"));
    }

    // 將切片(Slice)安全轉換為固定大小的 16 位元組陣列借用
    let mut matrix_array = [0u8; 16];
    matrix_array.copy_from_slice(js_matrix);

    let field = match error_type {
        1 => CorruptedField::Row0Col2VertexColorC,
        2 => CorruptedField::Row3Col1Interaction,
        _ => CorruptedField::NoCorruption,
    };

    // 呼叫我們撰寫的核心 XOR 組合拳演算法
    match TasteSecurity::self_heal(&mut matrix_array, field) {
        Ok(_) => Ok(matrix_array.to_vec()),
        Err(err) => Err(JsValue::from_str(err)),
    }
}
