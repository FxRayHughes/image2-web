import { useState } from "react";
import { Dialog, IconButton, Box, AppBar, Toolbar, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useAppState, useAppDispatch } from "../context/AppContext";

export default function Lightbox() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const { open, urls, index } = state.lightbox;
  const hasMultiple = urls.length > 1;

  function close() {
    dispatch({ type: "CLOSE_LIGHTBOX" });
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }

  function goTo(newIdx: number) {
    dispatch({ type: "OPEN_LIGHTBOX", urls, index: newIdx });
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      fullScreen
      slotProps={{ paper: { sx: { bgcolor: "rgba(0,0,0,0.95)" } } }}
      onKeyDown={(e) => {
        if (e.key === "Escape") { close(); e.preventDefault(); }
        if (e.key === "ArrowLeft" && hasMultiple) { goTo((index - 1 + urls.length) % urls.length); e.preventDefault(); }
        if (e.key === "ArrowRight" && hasMultiple) { goTo((index + 1) % urls.length); e.preventDefault(); }
      }}
    >
      <AppBar position="static" sx={{ bgcolor: "transparent" }} elevation={0}>
        <Toolbar>
          <Typography variant="body2" sx={{ flex: 1, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
            {hasMultiple ? `${index + 1} / ${urls.length}` : ""}
          </Typography>
          <IconButton
            onClick={close}
            sx={{
              bgcolor: "rgba(0,0,0,0.65)",
              color: "#fff",
              width: 40,
              height: 40,
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.85)" },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "default",
          position: "relative",
        }}
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.15 : 0.15;
          setScale((s) => Math.max(0.5, Math.min(5, s + delta)));
        }}
        onMouseDown={(e) => {
          if (e.button !== 0 || scale <= 1) return;
          setDragging(true);
          setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
        }}
        onMouseMove={(e) => {
          if (!dragging) return;
          setTranslate({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
      >
        {hasMultiple && (
          <IconButton
            onClick={() => goTo((index - 1 + urls.length) % urls.length)}
            sx={{
              position: "absolute", left: 8, zIndex: 1,
              bgcolor: "rgba(0,0,0,0.65)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.85)" },
            }}
          >
            <NavigateBeforeIcon />
          </IconButton>
        )}
        <img
          src={urls[index] || ""}
          alt="预览"
          style={{
            maxWidth: "90vw",
            maxHeight: "80vh",
            objectFit: "contain",
            borderRadius: 12,
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transition: dragging ? "none" : "transform 0.15s",
            userSelect: "none",
          }}
          draggable={false}
        />
        {hasMultiple && (
          <IconButton
            onClick={() => goTo((index + 1) % urls.length)}
            sx={{
              position: "absolute", right: 8, zIndex: 1,
              bgcolor: "rgba(0,0,0,0.65)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.85)" },
            }}
          >
            <NavigateNextIcon />
          </IconButton>
        )}
      </Box>

      {hasMultiple && (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1, p: 1.5, overflow: "auto" }}>
          {urls.map((url, i) => (
            <Box
              key={i}
              onClick={() => goTo(i)}
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1,
                overflow: "hidden",
                border: 2,
                borderColor: i === index ? "primary.main" : "transparent",
                opacity: i === index ? 1 : 0.5,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Box>
          ))}
        </Box>
      )}
    </Dialog>
  );
}
