import { Drawer, Box, Typography, IconButton, Fab, Badge } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ListIcon from "@mui/icons-material/List";
import { useAppState, useAppDispatch } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { addHistory } from "../services/db";
import { trackedObjectUrl } from "../services/utils";
import TaskCard from "./TaskCard";

export default function QueueDrawer() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const runningCount = state.tasks.filter((t) => t.status === "running").length;
  const hasTasks = state.tasks.length > 0;

  function handleViewTask(id: string) {
    const task = state.tasks.find((t) => t.id === id);
    if (!task || task.status !== "done") return;
    dispatch({ type: "SET_ACTIVE_TASK", id });
    const images = task.blobs.map((blob) => ({ blob, url: trackedObjectUrl(blob) }));
    dispatch({
      type: "SET_CURRENT_RESULT",
      payload: { images, format: task.format, mode: "generate" as const },
    });
    dispatch({ type: "SET_QUEUE_DRAWER", open: false });
    navigate("/generate");
  }

  function handleCancelTask(id: string) {
    const task = state.tasks.find((t) => t.id === id);
    if (task) task.abortController.abort();
  }

  async function handleRemoveTask(id: string) {
    const task = state.tasks.find((t) => t.id === id);
    if (task && task.status === "done" && task.blobs.length) {
      await addHistory({
        time: Date.now(),
        mode: "generate",
        prompt: task.prompt,
        size: task.size,
        quality: task.quality,
        format: task.format,
        n: task.n,
        blobs: task.blobs,
      });
      dispatch({ type: "ADD_PROMPT_TO_HISTORY", text: task.prompt });
    }
    dispatch({ type: "REMOVE_TASK", id });
  }

  return (
    <>
      <Drawer
        anchor="right"
        open={state.queueDrawerOpen}
        onClose={() => dispatch({ type: "SET_QUEUE_DRAWER", open: false })}
        sx={{ "& .MuiDrawer-paper": { width: 340, maxWidth: "90vw" } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>生成队列</Typography>
          <IconButton size="small" onClick={() => dispatch({ type: "SET_QUEUE_DRAWER", open: false })}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ flex: 1, overflow: "auto", p: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
          {!hasTasks && (
            <Typography color="text.secondary" sx={{ textAlign: "center", mt: 8 }}>暂无任务</Typography>
          )}
          {state.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isActive={task.id === state.activeTaskId}
              onView={() => handleViewTask(task.id)}
              onCancel={() => handleCancelTask(task.id)}
              onRemove={() => handleRemoveTask(task.id)}
            />
          ))}
        </Box>
      </Drawer>

      <Fab
        color="primary"
        size="small"
        onClick={() => dispatch({ type: "TOGGLE_QUEUE_DRAWER" })}
        sx={{
          position: "fixed",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          zIndex: 1200,
        }}
      >
        <Badge badgeContent={runningCount} color="error" invisible={runningCount === 0}>
          <ListIcon />
        </Badge>
      </Fab>
    </>
  );
}
