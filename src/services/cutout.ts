import { RMBG_MODULE_URL } from "./config";
import { getCutoutConfig } from "./config";
import { makeConfigKey } from "./utils";
import type { CutoutConfig } from "./config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let rmbgModulePromise: Promise<any> | null = null;

interface RmbgState {
  loadedKey: string;
  loadingPromise: Promise<CutoutConfig> | null;
  onStateChange: ((msg: string, isError: boolean) => void) | null;
}

const rmbgState: RmbgState = {
  loadedKey: "",
  loadingPromise: null,
  onStateChange: null,
};

function setState(msg: string, isError = false): void {
  if (rmbgState.onStateChange) {
    rmbgState.onStateChange(msg, isError);
  }
}

export function onCutoutStateChange(cb: (msg: string, isError: boolean) => void): void {
  rmbgState.onStateChange = cb;
}

export async function getRmbgModule() {
  if (!rmbgModulePromise) {
    rmbgModulePromise = import(/* @vite-ignore */ RMBG_MODULE_URL);
  }
  return rmbgModulePromise;
}

export async function ensureCutoutModel(
  device: string,
  model: string,
): Promise<CutoutConfig> {
  const { preload } = await getRmbgModule();
  const config = getCutoutConfig(device, model);
  const configKey = makeConfigKey(config);
  if (rmbgState.loadedKey === configKey) {
    return config;
  }
  if (rmbgState.loadingPromise) {
    return rmbgState.loadingPromise;
  }

  setState("模型加载中...");
  const promise: Promise<CutoutConfig> = preload(config)
    .then(() => {
      rmbgState.loadedKey = configKey;
      setState(`模型已加载 · ${config.device.toUpperCase()} / ${config.model}`);
      return config;
    })
    .catch((error: Error) => {
      setState(`模型加载失败：${error.message}`, true);
      throw error;
    })
    .finally(() => {
      rmbgState.loadingPromise = null;
    });

  rmbgState.loadingPromise = promise;
  return promise;
}

export async function runCutoutCore(
  sourceFile: File,
  device: string,
  model: string,
): Promise<Blob> {
  const { removeBackground } = await getRmbgModule();
  const config = await ensureCutoutModel(device, model);
  return await removeBackground(sourceFile, config);
}
