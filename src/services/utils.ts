const objectUrlPool = new Set<string>();

let _dragBlob: Blob | null = null;
export function setDragBlob(blob: Blob | null) { _dragBlob = blob; }
export function getDragBlob(): Blob | null { return _dragBlob; }

export function trackedObjectUrl(blob: Blob): string {
  const url = URL.createObjectURL(blob);
  objectUrlPool.add(url);
  return url;
}

export function formatBytes(value: number): string {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  const digits = size >= 10 || unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(digits)} ${units[unitIndex]}`;
}

export function escapeHTML(value: string): string {
  const div = document.createElement("div");
  div.textContent = value || "";
  return div.innerHTML;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function setButtonBusy(
  button: HTMLButtonElement,
  busy: boolean,
  busyText: string,
  idleText: string,
): void {
  button.disabled = busy;
  button.textContent = busy ? busyText : idleText;
}

export function makeConfigKey(config: { device: string; model: string }): string {
  return JSON.stringify({ device: config.device, model: config.model });
}

export async function blobToFile(blob: Blob, filename: string): Promise<File> {
  const type = blob.type || "image/png";
  return new File([blob], filename, { type });
}

export async function getImageDimensions(
  blob: Blob,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("读取图片尺寸失败"));
    };
    img.src = url;
  });
}

export async function normalizeImageBlob(
  blob: Blob,
  format: "png" | "jpeg" = "png",
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas context 获取失败")); return; }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (normalized) => {
          if (normalized) resolve(normalized);
          else reject(new Error("Canvas 转 Blob 失败"));
        },
        `image/${format}`,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片加载失败"));
    };
    img.src = url;
  });
}
