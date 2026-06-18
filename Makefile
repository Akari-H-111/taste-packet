# =====================================================================
# X-Taste Protocol Cross-Platform Build System
# @version 1.0.0
# @license MIT
# =====================================================================

# 編譯工具鏈配置
WASM_PACK := wasm-pack
CARGO     := cargo
NPM       := npm

# 目錄定義
CORE_DIR   := ./xtaste-core
SDK_DIR    := ./xtaste-client-sdk
WASM_OUT   := $(SDK_DIR)/src/wasm_generated

.PHONY: all help init test build-wasm install-deps clean

# 預設指令：顯示幫助說明
all: help

help:
	@echo "=================== X-Taste 編譯自動化系統 ==================="
	@echo "開發指令:"
	@echo "  make init          - 初始化環境，安裝 Rust 跨平台 Wasm 工具鏈"
	@echo "  make test          - 執行 Rust 底層安全演算法單元測試"
	@echo "  make build-wasm    - 將 Rust 核心編駁並打包為前端專用 .wasm"
	@echo "  make clean         - 清理所有快取與編譯產物"
	@echo "=============================================================="

# 1. 初始化環境：安裝 wasm-pack 核心工具
init:
	@echo "正在檢查並安裝 WebAssembly 跨平台編譯工具鏈..."
	@rustup target add wasm32-unknown-unknown
	@which $(WASM_PACK) > /dev/null || $(CARGO) install wasm-pack
	@echo "[✓] X-Taste 開發環境初始化完成。"

# 2. 執行原生單元測試：確保 XOR 容錯算法正確率為 100%
test:
	@echo "正在執行底層數學演算法與正交容錯稽核..."
	cd $(CORE_DIR) && $(CARGO) test -- --nocapture

# 3. 跨平台編譯核心：將 Rust 原始碼編譯並輸出至前端 SDK 目錄
build-wasm: test
	@echo "正在啟動 LLVM 進行無記憶體分配之 Wasm 極限編譯..."
	mkdir -p $(WASM_OUT)
	# --target web 確保生成的 JS 膠水代碼可以直接在瀏覽器和 Web Worker 內執行
	cd $(CORE_DIR) && $(WASM_PACK) build --target web --out-dir ../$(WASM_OUT) --release
	@echo "[✓] WebAssembly 二進位模組與 JS 膠水層封裝完畢。"
	@echo "👉 產物已成功部署至: $(WASM_OUT)"

# 4. 清理命令：還原倉庫純淨狀態
clean:
	@echo "正在清理快取與編譯歷史紀錄..."
	cd $(CORE_DIR) && $(CARGO) clean
	rm -rf $(WASM_OUT)
	rm -rf $(CORE_DIR)/pkg
	@echo "[✓] 倉庫清理完畢。"
