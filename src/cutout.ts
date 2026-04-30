import { RMBG_MODULE_URL } from "./config";
import { getCutoutConfig } from "./config";
import { makeConfigKey } from "./utils";
import { $ } from "./utils";
import type { CutoutConfig } from "./config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let rmbgModulePromise: Promise<any> | null = null;

const rmbgState = {
  loadedKey: "",
  loadingPromise: null as Promise<CutoutConfig> | null,
};

export async function getRmbgModule() {
  if (!rmbgModulePromise) {
    rmbgModulePromise = import(/* @vite-ignore */ RMBG_MODULE_URL);
  }
  return rmbgModulePromise;
}

export function setCutoutModelState(message: string, isError = false): void {
  const el = $("cutoutModelState");
  el.textContent = message;
  el.style.color = isError ? "var(--danger)" : "";
}

export async function ensureCutoutModel(): Promise<CutoutConfig> {
  const { preload } = await getRmbgModule();
  const config = getCutoutConfig();
  const configKey = makeConfigKey(config);
  if (rmbgState.loadedKey === configKey) {
    return config;
  }
  if (rmbgState.loadingPromise) {
    return rmbgState.loadingPromise;
  }

  setCutoutModelState("模型加载中...");
  const promise: Promise<CutoutConfig> = preload(config)
    .then(() => {
      rmbgState.loadedKey = configKey;
      setCutoutModelState(
        `模型已加载 · ${config.device.toUpperCase()} / ${config.model}`,
      );
      return config;
    })
    .catch((error: Error) => {
      setCutoutModelState(`模型加载失败：${error.message}`, true);
      throw error;
    })
    .finally(() => {
      rmbgState.loadingPromise = null;
    });

  rmbgState.loadingPromise = promise;
  return promise;
}

export async function runCutoutCore(sourceFile: File): Promise<Blob> {
  const { removeBackground } = await getRmbgModule();
  const config = await ensureCutoutModel();
  return await removeBackground(sourceFile, config);
}
