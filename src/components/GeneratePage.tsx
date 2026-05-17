import { useEffect, useState } from "react";
import {
  Box, Typography, Button, Card, CardMedia, LinearProgress, Paper, Chip,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppState, useAppDispatch } from "../context/AppContext";
import { trackedObjectUrl, setDragBlob } from "../services/utils";
import type { GenerationTask } from "../context/types";

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}分${s}秒`;
}

function RunningTaskBanner({ task }: { task: GenerationTask }) {
  const [elapsed, setElapsed] = useState(Math.floor((Date.now() - task.createdAt) / 1000));

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - task.createdAt) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [task.createdAt]);

  const doneCount = task.blobs.length;
  const totalCount = task.n;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2, mb: 2,
        background: "linear-gradient(135deg, rgba(90,143,212,0.08) 0%, rgba(60,60,100,0.06) 100%)",
        borderColor: "info.main",
        borderWidth: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <CircularProgress size={16} sx={{ color: "info.main" }} />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          生成中 {doneCount}/{totalCount}
        </Typography>
        <Typography variant="caption" color="info.main" sx={{ fontVariantNumeric: "tabular-nums" }}>
          {formatElapsed(elapsed)}
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" noWrap>{task.prompt}</Typography>
      <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
        <Chip label={task.size === "auto" ? "自动" : task.size} size="small" sx={{ height: 18, fontSize: 10 }} />
      </Box>
      <LinearProgress variant="determinate" value={progress} sx={{ mt: 1.5, borderRadius: 1 }} />

      {doneCount > 0 && (
        <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
          {task.blobs.map((blob, i) => (
            <Box key={i} sx={{ width: 56, height: 56, borderRadius: 1, overflow: "hidden", border: 1, borderColor: "divider" }}>
              <img src={trackedObjectUrl(blob)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}

export default function GeneratePage() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const runningTasks = state.tasks.filter((t) => t.status === "running");
  const lastDoneTask = [...state.tasks].reverse().find((t) => t.status === "done" && t.blobs.length > 0);
  const source = state.currentResult || (lastDoneTask ? {
    images: lastDoneTask.blobs.map((b) => ({ blob: b, url: trackedObjectUrl(b) })),
    format: lastDoneTask.format,
    mode: "generate" as const,
  } : null);

  const hasContent = source && source.images.length > 0;
  const showEmpty = !hasContent && runningTasks.length === 0;

  if (showEmpty) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, flexDirection: "column", gap: 2 }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, mb: 0.5 }}>
            准备就绪
          </Typography>
          <Typography variant="body2" color="text.secondary">
            填写左侧参数，点击"生成图片"开始
          </Typography>
        </Box>
        <Button variant="outlined" size="small" onClick={() => navigate("/gallery")}>
          查看图库
        </Button>
      </Box>
    );
  }

  const { images, mode } = source || { images: [], mode: "generate" as const };

  return (
    <Box sx={{ p: 2, flex: 1, overflow: "auto" }}>
      {runningTasks.map((task) => (
        <RunningTaskBanner key={task.id} task={task} />
      ))}

      {hasContent && (
        <>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {mode === "cutout" ? "抠图结果" : "生成结果"} · {images.length} 张
            </Typography>
            <Button size="small" variant="outlined" onClick={() => navigate("/gallery")}>
              查看图库
            </Button>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: images.length === 1 ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 2,
            }}
          >
            {images.map((item, idx) => {
              const url = item.url || trackedObjectUrl(item.blob);
              return (
                <Card
                  key={idx}
                  sx={{
                    overflow: "hidden",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    image={url}
                    alt={`结果 ${idx + 1}`}
                    draggable
                    onDragStart={(e) => {
                      setDragBlob(item.blob);
                      e.dataTransfer.setData("application/x-generated-image", "1");
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    onDragEnd={() => setDragBlob(null)}
                    sx={{ aspectRatio: "1", objectFit: "contain", bgcolor: "background.default", cursor: "pointer" }}
                    onClick={() => {
                      const allUrls = images.map((img) => img.url || trackedObjectUrl(img.blob));
                      dispatch({ type: "OPEN_LIGHTBOX", urls: allUrls, index: idx });
                    }}
                  />
                </Card>
              );
            })}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
            已自动保存到图库
          </Typography>
        </>
      )}
    </Box>
  );
}
