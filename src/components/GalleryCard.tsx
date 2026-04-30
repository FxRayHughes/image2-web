import {
  Card, CardMedia, CardContent, CardActions, Box, Typography, IconButton, Chip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/Image";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import { useAppDispatch } from "../context/AppContext";
import { trackedObjectUrl, normalizeImageBlob, downloadBlob } from "../services/utils";
import { deleteHistory } from "../services/db";
import type { HistoryRecord } from "../services/db";

interface Props {
  record: HistoryRecord;
  blob: Blob;
  blobIndex: number;
  totalBlobs: number;
  onRefresh: () => void;
}

export default function GalleryCard({ record, blob, blobIndex, totalBlobs, onRefresh }: Props) {
  const dispatch = useAppDispatch();
  const url = trackedObjectUrl(blob);
  const t = new Date(record.time);
  const timeStr = `${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")} ${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
  const typeLabel = record.mode === "cutout" ? "抠图" : "生图";

  function openLightbox() {
    dispatch({ type: "OPEN_LIGHTBOX", urls: [url], index: 0 });
  }

  async function handleCopyPrompt() {
    try {
      await navigator.clipboard.writeText(record.prompt || "");
      dispatch({ type: "SHOW_TOAST", message: "提示词已复制" });
    } catch {
      dispatch({ type: "SHOW_TOAST", message: "复制失败" });
    }
  }

  async function handleUseAsRef(e: React.MouseEvent) {
    e.stopPropagation();
    const normalized = await normalizeImageBlob(blob, "png");
    const file = new File([normalized], `ref-${record.id}-${blobIndex}.png`, { type: "image/png" });
    dispatch({ type: "ADD_REFERENCE_FILES", files: [file] });
    dispatch({ type: "SHOW_TOAST", message: "已添加为参考图" });
  }

  async function handleUseForCutout(e: React.MouseEvent) {
    e.stopPropagation();
    const type = blob.type || "image/png";
    const ext = type.split("/")[1] || "png";
    const file = new File([blob], `cutout-${record.id}-${blobIndex}.${ext}`, { type });
    dispatch({ type: "SET_CUTOUT_SOURCE", file });
    dispatch({ type: "SHOW_TOAST", message: "已设为抠图源图" });
  }

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    downloadBlob(blob, `gpt-image-${record.id}-${blobIndex}.${record.format || "png"}`);
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    await deleteHistory(record.id!);
    onRefresh();
    dispatch({ type: "SHOW_TOAST", message: "已删除" });
  }

  return (
    <Card sx={{ "&:hover .gallery-overlay": { opacity: 1 } }}>
      <Box sx={{ position: "relative", aspectRatio: "1", bgcolor: "background.default" }}>
        <CardMedia
          component="img"
          image={url}
          alt=""
          sx={{ height: "100%", objectFit: "cover", cursor: "pointer" }}
          onClick={openLightbox}
        />
        {totalBlobs > 1 && (
          <Chip
            label={`${blobIndex + 1}/${totalBlobs}`}
            size="small"
            sx={{ position: "absolute", top: 6, right: 6, bgcolor: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 11 }}
          />
        )}
        <Box
          className="gallery-overlay"
          sx={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, flexWrap: "wrap",
            bgcolor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
            opacity: 0, transition: "opacity 0.2s",
          }}
        >
          <Chip icon={<ZoomInIcon />} label="预览" size="small" clickable onClick={openLightbox} sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)" }} variant="outlined" />
          <Chip icon={<ImageIcon />} label="参考图" size="small" clickable onClick={handleUseAsRef} sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)" }} variant="outlined" />
          <Chip icon={<ContentCutIcon />} label="抠图" size="small" clickable onClick={handleUseForCutout} sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)" }} variant="outlined" />
          <Chip icon={<DownloadIcon />} label="下载" size="small" clickable onClick={handleDownload} sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)" }} variant="outlined" />
        </Box>
      </Box>
      <CardContent sx={{ py: 1, px: 1.5, "&:last-child": { pb: 1 } }}>
        <Typography variant="body2" color="text.secondary" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.4 }}>
          {record.prompt || (record.mode === "cutout" ? "[AI抠图]" : "")}
        </Typography>
      </CardContent>
      <CardActions sx={{ px: 1.5, pb: 1, pt: 0, justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Chip label={typeLabel} size="small" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
          <Typography variant="caption" color="text.secondary">{record.size || "原图"} · {timeStr}</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <IconButton size="small" onClick={handleCopyPrompt} title="复制提示词"><ContentCopyIcon sx={{ fontSize: 16 }} /></IconButton>
          <IconButton size="small" onClick={handleDelete} title="删除"><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>
        </Box>
      </CardActions>
    </Card>
  );
}
