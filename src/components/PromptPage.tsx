import { useEffect, useState } from "react";
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails,
  Chip, IconButton, Card, CardMedia,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { getAllHistory } from "../services/db";
import type { HistoryRecord } from "../services/db";
import { useAppDispatch } from "../context/AppContext";
import { trackedObjectUrl } from "../services/utils";

interface PromptGroup {
  prompt: string;
  records: HistoryRecord[];
  blobs: { blob: Blob; record: HistoryRecord; index: number }[];
  latestTime: number;
}

function groupByPrompt(records: HistoryRecord[]): PromptGroup[] {
  const map = new Map<string, PromptGroup>();

  for (const record of records) {
    const key = (record.prompt || "").trim();
    if (!key) continue;

    let group = map.get(key);
    if (!group) {
      group = { prompt: key, records: [], blobs: [], latestTime: 0 };
      map.set(key, group);
    }
    group.records.push(record);
    if (record.time > group.latestTime) group.latestTime = record.time;

    const recordBlobs = record.blobs || [];
    for (let i = 0; i < recordBlobs.length; i++) {
      group.blobs.push({ blob: recordBlobs[i], record, index: i });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.latestTime - a.latestTime);
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}-${dd} ${hh}:${mi}`;
}

export default function PromptPage() {
  const [groups, setGroups] = useState<PromptGroup[]>([]);
  const dispatch = useAppDispatch();

  useEffect(() => {
    getAllHistory()
      .then((records) => setGroups(groupByPrompt(records)))
      .catch(() => {});
  }, []);

  async function copyPrompt(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      dispatch({ type: "SHOW_TOAST", message: "提示词已复制" });
    } catch {
      dispatch({ type: "SHOW_TOAST", message: "复制失败" });
    }
  }

  if (!groups.length) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
        <Typography color="text.secondary">暂无提示词记录</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, flex: 1, overflow: "auto" }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        提示词 · {groups.length} 组
      </Typography>

      {groups.map((group) => (
        <Accordion
          key={group.prompt}
          defaultExpanded={false}
          disableGutters
          sx={{
            mb: 1,
            bgcolor: "background.paper",
            "&:before": { display: "none" },
            border: 1,
            borderColor: "divider",
            borderRadius: "12px !important",
            overflow: "hidden",
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ px: 2, minHeight: 56 }}
          >
            <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap title={group.prompt}>
                {group.prompt}
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, alignItems: "center" }}>
                <Chip
                  label={`${group.blobs.length} 张`}
                  size="small"
                  sx={{ height: 18, fontSize: 10 }}
                />
                <Chip
                  label={`${group.records.length} 次生成`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 18, fontSize: 10 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {formatTime(group.latestTime)}
                </Typography>
              </Box>
            </Box>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); copyPrompt(group.prompt); }}
              title="复制提示词"
              sx={{ alignSelf: "center" }}
            >
              <ContentCopyIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </AccordionSummary>

          <AccordionDetails sx={{ px: 2, pb: 2 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                gap: 1,
              }}
            >
              {group.blobs.map((item, idx) => {
                const url = trackedObjectUrl(item.blob);
                return (
                  <Card
                    key={idx}
                    sx={{
                      cursor: "pointer",
                      overflow: "hidden",
                      transition: "transform 0.15s",
                      "&:hover": { transform: "scale(1.03)" },
                    }}
                    onClick={() => {
                      const allUrls = group.blobs.map((b) => trackedObjectUrl(b.blob));
                      dispatch({ type: "OPEN_LIGHTBOX", urls: allUrls, index: idx });
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={url}
                      alt=""
                      sx={{ aspectRatio: "1", objectFit: "cover", bgcolor: "background.default" }}
                    />
                  </Card>
                );
              })}
            </Box>

            {group.records.length > 1 && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  生成记录：
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}>
                  {group.records.map((r, i) => (
                    <Chip
                      key={i}
                      label={`${r.size || "auto"} · ${r.quality || "auto"} · ${formatTime(r.time)}`}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: 10 }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
