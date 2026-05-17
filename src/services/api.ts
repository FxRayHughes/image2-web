import { loadConfig } from "./config";

export async function itemToBlob(
  item: { b64_json?: string; url?: string },
  fallbackFormat: string,
): Promise<Blob> {
  if (item.b64_json) {
    const bin = atob(item.b64_json);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) {
      arr[i] = bin.charCodeAt(i);
    }
    return new Blob([arr], { type: `image/${fallbackFormat || "png"}` });
  }
  if (item.url) {
    const res = await fetch(item.url, { referrerPolicy: "no-referrer" });
    if (!res.ok) {
      throw new Error(`下载图片失败: HTTP ${res.status}`);
    }
    return await res.blob();
  }
  throw new Error("响应中未找到图片数据");
}

export interface GenerateParams {
  prompt: string;
  size: string;
  quality: string;
  format: string;
  n: number;
  referenceFiles: File[];
}

async function singleRequest(
  params: GenerateParams,
  signal?: AbortSignal,
): Promise<Blob> {
  const cfg = loadConfig();
  if (!cfg.apiUrl || !cfg.apiKey) {
    throw new Error("请先配置 API 地址和密钥");
  }

  const hasRefs = params.referenceFiles.length > 0;
  const endpoint = hasRefs ? cfg.editsPath : cfg.generationsPath;
  const url = cfg.apiUrl + endpoint;

  let res: Response;
  if (hasRefs) {
    const fd = new FormData();
    fd.append("model", "gpt-image-2");
    fd.append("prompt", params.prompt);
    fd.append("n", "1");
    fd.append("size", params.size);
    fd.append("quality", params.quality);
    fd.append("output_format", params.format);
    fd.append("response_format", "b64_json");
    const validFiles = params.referenceFiles.filter((file) => {
      if (file.size === 0) return false;
      if (!file.type.startsWith("image/")) return false;
      return true;
    });
    if (!validFiles.length) {
      throw new Error("参考图文件无效，请重新上传");
    }
    validFiles.forEach((file) => fd.append("image", file, file.name));
    res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      body: fd,
      signal,
    });
  } else {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-2",
        prompt: params.prompt,
        size: params.size,
        quality: params.quality,
        output_format: params.format,
        response_format: "b64_json",
        n: 1,
      }),
      signal,
    });
  }

  const text = await res.text();
  let data: {
    data?: Array<{ b64_json?: string; url?: string }>;
    error?: { message?: string };
    message?: string;
  };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`响应解析失败: ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || `HTTP ${res.status}`);
  }

  const items = data.data || [];
  if (!items.length) throw new Error("响应中未包含图片数据");
  return itemToBlob(items[0], params.format);
}

export async function generateImage(
  params: GenerateParams,
  onBlob?: (blob: Blob, index: number) => void,
  signal?: AbortSignal,
): Promise<Blob[]> {
  const count = Math.max(1, params.n);
  const blobs: Blob[] = new Array(count);
  let completedCount = 0;
  let firstError: Error | null = null;

  const promises = Array.from({ length: count }, (_, i) =>
    singleRequest(params, signal)
      .then((blob) => {
        blobs[i] = blob;
        completedCount++;
        if (onBlob) onBlob(blob, i);
      })
      .catch((err) => {
        if (!firstError && (err as Error).name !== "AbortError") {
          firstError = err as Error;
        }
        if ((err as Error).name === "AbortError") throw err;
      }),
  );

  await Promise.all(promises);

  const results = blobs.filter(Boolean);
  if (!results.length) {
    throw firstError || new Error("所有请求均失败");
  }
  return results;
}
