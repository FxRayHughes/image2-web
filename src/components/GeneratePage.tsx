import { Box, Typography, Button, Card, CardMedia } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppState, useAppDispatch } from "../context/AppContext";
import { trackedObjectUrl, setDragBlob } from "../services/utils";

export default function GeneratePage() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Show last completed task from queue, or currentResult
  const lastDoneTask = [...state.tasks].reverse().find((t) => t.status === "done" && t.blobs.length > 0);
  const source = state.currentResult || (lastDoneTask ? { images: lastDoneTask.blobs.map((b) => ({ blob: b, url: trackedObjectUrl(b) })), format: lastDoneTask.format, mode: "generate" as const } : null);

  if (!source || !source.images.length) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, flexDirection: "column", gap: 2 }}>
        <Typography color="text.secondary">填写左侧参数，点击"生成图片"开始</Typography>
        <Button variant="outlined" size="small" onClick={() => navigate("/gallery")}>
          查看图库
        </Button>
      </Box>
    );
  }

  const { images, mode } = source;

  return (
    <Box sx={{ p: 2, flex: 1, overflow: "auto" }}>
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
          gridTemplateColumns: images.length === 1 ? "1fr" : "1fr 1fr",
          gap: 2,
        }}
      >
        {images.map((item, idx) => {
          const url = item.url || trackedObjectUrl(item.blob);
          return (
            <Card key={idx}>
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
        此结果已自动保存到图库
      </Typography>
    </Box>
  );
}
