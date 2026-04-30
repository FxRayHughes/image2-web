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
    const res = await fetch(item.url);
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

export async function generateImage(
  params: GenerateParams,
  onBlob?: (blob: Blob, index: number) => void,
  signal?: AbortSignal,
): Promise<Blob[]> {
  const cfg = loadConfig();
  if (!cfg.apiUrl || !cfg.apiKey) {
    throw new Error("请先配置 API 地址和密钥");
  }

  const hasRefs = params.referenceFiles.length > 0;
  const endpoint = hasRefs ? "/v1/images/edits" : "/v1/images/generations";
  const url = cfg.apiUrl + endpoint;

  let res: Response;
  if (hasRefs) {
    const fd = new FormData();
    fd.append("model", "gpt-image-2");
    fd.append("prompt", params.prompt);
    fd.append("n", String(params.n));
    fd.append("size", params.size);
    fd.append("quality", params.quality);
    fd.append("output_format", params.format);
    const validFiles = params.referenceFiles.filter((file) => {
      if (file.size === 0) {
        console.warn("跳过空文件:", file.name);
        return false;
      }
      if (!file.type.startsWith("image/")) {
        console.warn("跳过非图片文件:", file.name);
        return false;
      }
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
        n: params.n,
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

  const blobs: Blob[] = [];
  const items = data.data || [];
  for (let i = 0; i < items.length; i++) {
    const blob = await itemToBlob(items[i], params.format);
    blobs.push(blob);
    if (onBlob) onBlob(blob, i);
  }
  return blobs;
}
