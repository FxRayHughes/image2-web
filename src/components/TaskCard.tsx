import { useEffect, useState } from "react";
import {
  Paper, Box, Typography, Chip, IconButton, Button, CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { GenerationTask } from "../context/types";

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}分${s}秒`;
}

interface Props {
  task: GenerationTask;
  isActive: boolean;
  onView: () => void;
  onCancel: () => void;
  onRemove: () => void;
}

export default function TaskCard({ task, isActive, onView, onCancel, onRemove }: Props) {
  const [elapsed, setElapsed] = useState(
    task.status === "running" ? Math.floor((Date.now() - task.createdAt) / 1000) : 0,
  );

  useEffect(() => {
    if (task.status !== "running") return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - task.createdAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [task.status, task.createdAt]);

  const statusColors: Record<string, "info" | "success" | "error"> = {
    running: "info",
    done: "success",
    error: "error",
  };
  const statusLabels: Record<string, string> = {
    running: "生成中",
    done: "完成",
    error: "失败",
  };

  const sizeLabel = task.size === "auto" ? "自动" : task.size;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        cursor: task.status === "done" ? "pointer" : "default",
        borderColor: isActive ? "primary.main" : "divider",
        bgcolor: isActive ? "action.hover" : "background.paper",
      }}
      onClick={task.status === "done" ? onView : undefined}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" noWrap title={task.prompt}>
            {task.prompt}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}>
            <Chip
              label={statusLabels[task.status]}
              color={statusColors[task.status]}
              size="small"
              icon={task.status === "running" ? <CircularProgress size={12} /> : undefined}
              sx={{ height: 20, fontSize: 11 }}
            />
            <Typography variant="caption" color="text.secondary">
              {sizeLabel} · {task.n}张
            </Typography>
            {task.status === "running" && (
              <Typography variant="caption" color="info.main" sx={{ fontVariantNumeric: "tabular-nums" }}>
                {formatElapsed(elapsed)}
              </Typography>
            )}
            {task.status === "error" && task.error && (
              <Typography variant="caption" color="error.main" noWrap sx={{ maxWidth: 160 }}>
                {task.error}
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
          {task.status === "done" && (
            <Button size="small" variant="outlined" sx={{ minWidth: 0, px: 1, fontSize: 11 }}>
              查看
            </Button>
          )}
          {task.status === "running" && (
            <Button size="small" color="error" variant="outlined" sx={{ minWidth: 0, px: 1, fontSize: 11 }} onClick={onCancel}>
              取消
            </Button>
          )}
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
}
