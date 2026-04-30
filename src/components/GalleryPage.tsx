import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, ImageList, ImageListItem, useMediaQuery, useTheme } from "@mui/material";
import { getAllHistory } from "../services/db";
import type { HistoryRecord } from "../services/db";
import GalleryCard from "./GalleryCard";

export default function GalleryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const isMedium = useMediaQuery(theme.breakpoints.down("md"));

  async function load() {
    try {
      const data = await getAllHistory();
      setRecords(data);
    } catch {
      // silently fail
    }
  }

  useEffect(() => { load(); }, []);

  const cols = isSmall ? 1 : isMedium ? 2 : 3;

  if (!records.length) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
        <Typography color="text.secondary">图库为空，生成图片后将自动出现在这里</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, flex: 1, overflow: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          图库 · {records.reduce((sum, r) => sum + (r.blobs?.length || 0), 0)} 张
        </Typography>
        <Typography
          variant="body2"
          color="primary"
          sx={{ cursor: "pointer", textDecoration: "underline" }}
          onClick={() => navigate("/generate")}
        >
          去生成
        </Typography>
      </Box>
      <ImageList cols={cols} gap={16}>
        {records.map((record) => {
          const blobs = record.blobs || [];
          return blobs.map((blob, idx) => (
            <ImageListItem key={`${record.id}-${idx}`}>
              <GalleryCard record={record} blob={blob} blobIndex={idx} totalBlobs={blobs.length} onRefresh={load} />
            </ImageListItem>
          ));
        })}
      </ImageList>
    </Box>
  );
}
