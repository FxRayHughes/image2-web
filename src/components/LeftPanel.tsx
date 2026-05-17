import { useState, useRef } from "react";
import {
  Box, Typography, TextField, Button, Select, MenuItem,
  ToggleButtonGroup, ToggleButton, Accordion, AccordionSummary, AccordionDetails,
  LinearProgress, Chip, IconButton, CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import { useAppState, useAppDispatch, createTask } from "../context/AppContext";
import { generateImage } from "../services/api";
import { addHistory } from "../services/db";
import { runCutoutCore, onCutoutStateChange } from "../services/cutout";
import { trackedObjectUrl, formatBytes, normalizeImageBlob, getImageDimensions, getDragBlob } from "../services/utils";
import { loadConfig } from "../services/config";
import { useNavigate } from "react-router-dom";

const SIZES = [
  { value: "auto", label: "自动" },
  { value: "1024x1024", label: "1024²" },
  { value: "1536x1024", label: "1536×1024" },
  { value: "1024x1536", label: "1024×1536" },
  { value: "2048x2048", label: "2K 方" },
  { value: "2048x1152", label: "2K 横" },
  { value: "3840x2160", label: "4K 横" },
  { value: "2160x3840", label: "4K 纵" },
  { value: "custom", label: "自定义" },
];

export default function LeftPanel() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState("");
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [count, setCount] = useState(1);
  const [format, setFormatVal] = useState<string>("png");
  const [quality, setQuality] = useState("high");
  const [cutoutLoading, setCutoutLoading] = useState(false);
  const [cutoutProgress, setCutoutProgress] = useState("");
  const [refDragOver, setRefDragOver] = useState(false);
  const [cutoutDragOver, setCutoutDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cutoutInputRef = useRef<HTMLInputElement>(null);

  onCutoutStateChange((msg, isError) => {
    setCutoutProgress(msg + (isError ? " (错误)" : ""));
  });

  function handleRefFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    if (files.length) dispatch({ type: "ADD_REFERENCE_FILES", files });
    e.target.value = "";
  }

  function removeRefFile(index: number) {
    dispatch({ type: "REMOVE_REFERENCE_FILE", index });
  }

  function extractDropImages(e: React.DragEvent): File[] | null {
    const blob = getDragBlob();
    if (e.dataTransfer.types.includes("application/x-generated-image") && blob) {
      return [new File([blob], `drag-${Date.now()}.png`, { type: blob.type || "image/png" })];
    }
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    return files.length ? files : null;
  }

  function handleRefDrop(e: React.DragEvent) {
    e.preventDefault();
    setRefDragOver(false);
    const files = extractDropImages(e);
    if (files) dispatch({ type: "ADD_REFERENCE_FILES", files });
  }

  function handleCutoutDrop(e: React.DragEvent) {
    e.preventDefault();
    setCutoutDragOver(false);
    const files = extractDropImages(e);
    if (files?.[0]) dispatch({ type: "SET_CUTOUT_SOURCE", file: files[0] });
  }

  function getSize(): string | null {
    if (state.selectedSize === "custom") {
      const w = +customW;
      const h = +customH;
      if (!w || !h) return null;
      return `${w}x${h}`;
    }
    return state.selectedSize;
  }

  async function runTask(task: ReturnType<typeof createTask>) {
    try {
      const cfg = loadConfig();
      if (!cfg.apiUrl || !cfg.apiKey) throw new Error("请先配置 API 地址和密钥");

      const normalizedRefs = await Promise.all(
        task.referenceFiles.map((f) =>
          normalizeImageBlob(f, "png").then((b) => new File([b], f.name || "ref.png", { type: "image/png" })),
        ),
      );

      const blobs = await generateImage(
        { prompt: task.prompt, size: task.size, quality: task.quality, format: task.format, n: task.n, referenceFiles: normalizedRefs },
        (blob) => {
          dispatch({ type: "UPDATE_TASK", id: task.id, updates: { blobs: [...(state.tasks.find((t) => t.id === task.id)?.blobs || []), blob] } });
        },
        task.abortController.signal,
      );

      dispatch({ type: "UPDATE_TASK", id: task.id, updates: { status: "done", blobs } });

      await addHistory({
        time: Date.now(), mode: "generate",
        prompt: task.prompt, size: task.size, quality: task.quality, format: task.format, n: task.n, blobs,
      });

      dispatch({ type: "ADD_PROMPT_TO_HISTORY", text: task.prompt });
      const images = blobs.map((blob) => ({ blob, url: trackedObjectUrl(blob) }));
      dispatch({ type: "SET_CURRENT_RESULT", payload: { images, format: task.format, mode: "generate" } });

      dispatch({ type: "SHOW_TOAST", message: `生成完成 · ${blobs.length} 张已保存到图库` });
      navigate("/generate");
    } catch (err) {
      const msg = (err as Error).name === "AbortError" ? "已取消" : (err as Error).message;
      dispatch({ type: "UPDATE_TASK", id: task.id, updates: { status: "error", error: msg } });
    }
  }

  function handleGenerate() {
    if (!prompt.trim()) { dispatch({ type: "SHOW_TOAST", message: "请填写提示词" }); return; }
    const size = getSize();
    if (!size) { dispatch({ type: "SHOW_TOAST", message: "请填写自定义尺寸" }); return; }

    dispatch({ type: "INCREMENT_TASK_COUNTER" });
    const nextId = state.taskIdCounter + 1;
    const task = createTask(nextId, { prompt: prompt.trim(), size, quality, format, n: count, referenceFiles: [...state.referenceFiles] });
    dispatch({ type: "ADD_TASK", task });

    runTask(task);
  }

  async function handleCutout() {
    const source = state.cutoutSourceFile;
    if (!source) { dispatch({ type: "SHOW_TOAST", message: "请先上传抠图源图" }); return; }

    setCutoutLoading(true);
    setCutoutProgress("准备中...");

    try {
      const blob = await runCutoutCore(source, state.cutoutDevice, state.cutoutModel);
      const dims = await getImageDimensions(blob).catch(() => null);
      const sizeText = dims ? `${dims.width}x${dims.height}` : "原图尺寸";

      await addHistory({
        time: Date.now(), mode: "cutout",
        prompt: `[AI抠图] ${source.name}`,
        size: sizeText, quality: "local", format: "png", n: 1, blobs: [blob],
      });

      const images = [{ blob, url: trackedObjectUrl(blob) }];
      dispatch({ type: "SET_CURRENT_RESULT", payload: { images, format: "png", mode: "cutout" } });
      dispatch({ type: "SHOW_TOAST", message: "抠图完成，已保存到图库" });
      navigate("/generate");
    } catch (err) {
      dispatch({ type: "SHOW_TOAST", message: `抠图失败: ${(err as Error).message}` });
    } finally {
      setCutoutLoading(false);
      setCutoutProgress("");
    }
  }

  const refUrls = state.referenceFiles.map((f) => trackedObjectUrl(f));
  const sectionLabel = (text: string) => (
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.5 }}>
      {text}
    </Typography>
  );

  return (
    <Box sx={{ p: 2, overflow: "auto", height: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Reference images */}
      <Box>
        {sectionLabel("参考图（可选）")}
        <Button variant="outlined" fullWidth size="small" onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setRefDragOver(true); }}
          onDragLeave={() => setRefDragOver(false)}
          onDrop={handleRefDrop}
          sx={{ mt: 0.5, py: 2, borderStyle: "dashed", textTransform: "none",
            ...(refDragOver && { borderColor: "primary.main", bgcolor: "action.hover", borderWidth: 2 }) }}>
          拖拽或点击上传参考图
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleRefFiles} />
        {state.referenceFiles.length > 0 && (
          <Box sx={{ display: "flex", gap: 0.5, mt: 1, flexWrap: "wrap" }}>
            {state.referenceFiles.map((_file, idx) => (
              <Box key={idx} sx={{ position: "relative", width: 56, height: 56, borderRadius: 1, overflow: "hidden", border: 1, borderColor: "divider" }}>
                <img src={refUrls[idx]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <IconButton size="small" onClick={() => removeRefFile(idx)}
                  sx={{ position: "absolute", top: 0, right: 0, p: 0, bgcolor: "rgba(0,0,0,0.6)", borderRadius: 0, "&:hover": { bgcolor: "rgba(0,0,0,0.8)" } }}>
                  <CloseIcon sx={{ fontSize: 14, color: "#fff" }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Prompt */}
      <Box>
        {sectionLabel("提示词")}
        <TextField multiline minRows={3} maxRows={6} fullWidth size="small" value={prompt}
          onChange={(e) => setPrompt(e.target.value)} placeholder="例：一只橘猫戴着橙色围巾抱着水獭，温暖插画风格" />
        {state.promptHistory.length > 0 && (
          <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}>
            {state.promptHistory.slice(0, 6).map((item) => (
              <Chip key={item.time}
                label={item.text.length > 20 ? item.text.slice(0, 20) + "..." : item.text}
                size="small" variant="outlined" onClick={() => setPrompt(item.text)}
                onDelete={() => dispatch({ type: "REMOVE_PROMPT_FROM_HISTORY", text: item.text })}
                sx={{ maxWidth: 200 }} />
            ))}
          </Box>
        )}
      </Box>

      {/* Size */}
      <Box>
        {sectionLabel("尺寸")}
        <ToggleButtonGroup value={state.selectedSize} exclusive
          onChange={(_, v) => v && dispatch({ type: "SET_SELECTED_SIZE", size: v })}
          size="small"
          sx={{ flexWrap: "wrap", gap: 0.5, "& .MuiToggleButton-root": { borderRadius: 1, border: "1px solid", borderColor: "divider", px: 1, py: 0.5, fontSize: 11 } }}>
          {SIZES.map((s) => (
            <ToggleButton key={s.value} value={s.value} sx={{ "&.Mui-selected": { bgcolor: "primary.main", color: "#fff", "&:hover": { bgcolor: "primary.light" } } }}>
              {s.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {state.selectedSize === "custom" && (
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <TextField size="small" placeholder="宽 (16倍数)" value={customW} onChange={(e) => setCustomW(e.target.value)} type="number" sx={{ flex: 1 }} />
            <TextField size="small" placeholder="高 (16倍数)" value={customH} onChange={(e) => setCustomH(e.target.value)} type="number" sx={{ flex: 1 }} />
          </Box>
        )}
      </Box>

      {/* Quality / Count / Format */}
      <Box sx={{ display: "flex", gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">质量</Typography>
          <Select value={quality} onChange={(e) => setQuality(e.target.value)} size="small" fullWidth>
            <MenuItem value="auto">自动</MenuItem>
            <MenuItem value="low">低</MenuItem>
            <MenuItem value="medium">中</MenuItem>
            <MenuItem value="high">高</MenuItem>
          </Select>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">数量</Typography>
          <TextField value={count} onChange={(e) => setCount(Math.max(1, Math.min(4, +e.target.value || 1)))}
            type="number" size="small" fullWidth slotProps={{ htmlInput: { min: 1, max: 4 } }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">格式</Typography>
          <Select value={format} onChange={(e) => setFormatVal(e.target.value)} size="small" fullWidth>
            <MenuItem value="png">PNG</MenuItem>
            <MenuItem value="jpeg">JPEG</MenuItem>
            <MenuItem value="webp">WebP</MenuItem>
          </Select>
        </Box>
      </Box>

      {/* Generate */}
      {(() => {
        const runningCount = state.tasks.filter((t) => t.status === "running").length;
        return (
          <Button variant="contained" fullWidth onClick={handleGenerate} sx={{ py: 1.5, fontSize: 15 }}>
            {runningCount > 0 ? `生成图片（${runningCount} 个进行中）` : "生成图片"}
          </Button>
        );
      })()}

      {/* Cutout */}
      <Accordion sx={{ bgcolor: "transparent", "&:before": { display: "none" } }} disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase" }} color="text.secondary">AI 抠图</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Button variant="outlined" fullWidth size="small" onClick={() => cutoutInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setCutoutDragOver(true); }}
            onDragLeave={() => setCutoutDragOver(false)}
            onDrop={handleCutoutDrop}
            sx={{ py: 2, borderStyle: "dashed", textTransform: "none", mb: 1,
              ...(cutoutDragOver && { borderColor: "primary.main", bgcolor: "action.hover", borderWidth: 2 }) }}>
            拖拽或点击上传抠图源图
          </Button>
          <input ref={cutoutInputRef} type="file" accept="image/*" hidden onChange={(e) => {
            const f = Array.from(e.target.files || []).find((x) => x.type.startsWith("image/"));
            if (f) dispatch({ type: "SET_CUTOUT_SOURCE", file: f });
            e.target.value = "";
          }} />

          {state.cutoutSourceFile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Chip
                label={`${state.cutoutSourceFile.name} · ${formatBytes(state.cutoutSourceFile.size)}`}
                size="small"
                onDelete={() => dispatch({ type: "SET_CUTOUT_SOURCE", file: null })}
              />
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
            <Select value={state.cutoutDevice} onChange={(e) => dispatch({ type: "SET_CUTOUT_DEVICE", device: e.target.value })} size="small" sx={{ flex: 1 }}>
              <MenuItem value="gpu">GPU</MenuItem>
              <MenuItem value="cpu">CPU</MenuItem>
            </Select>
            <Select value={state.cutoutModel} onChange={(e) => dispatch({ type: "SET_CUTOUT_MODEL", model: e.target.value })} size="small" sx={{ flex: 1 }}>
              <MenuItem value="small">Small</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="large">Large</MenuItem>
            </Select>
          </Box>

          <Button variant="contained" fullWidth size="small" disabled={cutoutLoading} onClick={handleCutout} sx={{ mb: 1 }}>
            {cutoutLoading ? <><CircularProgress size={14} sx={{ mr: 1 }} /> 处理中...</> : "执行抠图"}
          </Button>

          {cutoutLoading && <LinearProgress sx={{ mb: 0.5 }} />}
          <Typography variant="caption" color="text.secondary">
            {cutoutProgress || state.cutoutModelState.message}
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
