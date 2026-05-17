import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Select, MenuItem, Box, Typography, IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useAppState, useAppDispatch } from "../context/AppContext";
import {
  loadProfiles, getActiveProfileId, setActiveProfileId,
  addProfile, updateProfile, deleteProfile,
  DEFAULT_GENERATIONS_PATH, DEFAULT_EDITS_PATH,
} from "../services/config";
import type { ApiProfile } from "../services/config";

export default function ConfigModal() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [profiles, setProfiles] = useState<ApiProfile[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [generationsPath, setGenerationsPath] = useState(DEFAULT_GENERATIONS_PATH);
  const [editsPath, setEditsPath] = useState(DEFAULT_EDITS_PATH);

  useEffect(() => {
    if (state.configModalOpen) {
      const list = loadProfiles();
      setProfiles(list);
      const activeId = getActiveProfileId() || list[0]?.id || "";
      setSelectedId(activeId);
      const current = list.find((p) => p.id === activeId);
      if (current) {
        setName(current.name);
        setApiUrl(current.apiUrl);
        setApiKey(current.apiKey);
        setGenerationsPath(current.generationsPath || DEFAULT_GENERATIONS_PATH);
        setEditsPath(current.editsPath || DEFAULT_EDITS_PATH);
      }
    }
  }, [state.configModalOpen]);

  function selectProfile(id: string) {
    setSelectedId(id);
    const p = profiles.find((x) => x.id === id);
    if (p) {
      setName(p.name);
      setApiUrl(p.apiUrl);
      setApiKey(p.apiKey);
      setGenerationsPath(p.generationsPath || DEFAULT_GENERATIONS_PATH);
      setEditsPath(p.editsPath || DEFAULT_EDITS_PATH);
    }
  }

  function handleAdd() {
    const p = addProfile("新配置", "", "");
    setProfiles(loadProfiles());
    selectProfile(p.id);
    setActiveProfileId(p.id);
    dispatch({ type: "SET_ACTIVE_PROFILE", profile: p });
  }

  function handleDelete() {
    if (profiles.length <= 1) {
      dispatch({ type: "SHOW_TOAST", message: "至少保留一个配置" });
      return;
    }
    deleteProfile(selectedId);
    const updated = loadProfiles();
    setProfiles(updated);
    const newActive = getActiveProfileId() || updated[0]?.id || "";
    setSelectedId(newActive);
    const p = updated.find((x) => x.id === newActive) || null;
    if (p) {
      setName(p.name);
      setApiUrl(p.apiUrl);
      setApiKey(p.apiKey);
      setGenerationsPath(p.generationsPath || DEFAULT_GENERATIONS_PATH);
      setEditsPath(p.editsPath || DEFAULT_EDITS_PATH);
    }
    dispatch({ type: "SET_ACTIVE_PROFILE", profile: p });
  }

  function handleSave() {
    const trimmedUrl = apiUrl.trim().replace(/\/+$/, "");
    const trimmedKey = apiKey.trim();
    const trimmedName = name.trim() || "未命名";
    const trimmedGenPath = generationsPath.trim() || DEFAULT_GENERATIONS_PATH;
    const trimmedEditsPath = editsPath.trim() || DEFAULT_EDITS_PATH;
    if (!trimmedUrl || !trimmedKey) {
      dispatch({ type: "SHOW_TOAST", message: "请填写完整配置" });
      return;
    }
    if (profiles.find((p) => p.id === selectedId)) {
      updateProfile(selectedId, {
        name: trimmedName, apiUrl: trimmedUrl, apiKey: trimmedKey,
        generationsPath: trimmedGenPath, editsPath: trimmedEditsPath,
      });
    } else {
      const p = addProfile(trimmedName, trimmedUrl, trimmedKey);
      updateProfile(p.id, { generationsPath: trimmedGenPath, editsPath: trimmedEditsPath });
      setSelectedId(p.id);
      setActiveProfileId(p.id);
    }
    const updated = loadProfiles();
    setProfiles(updated);
    setActiveProfileId(selectedId);
    const p = updated.find((x) => x.id === selectedId) || null;
    dispatch({ type: "SET_ACTIVE_PROFILE", profile: p });
    dispatch({ type: "SHOW_TOAST", message: "配置已保存" });
    dispatch({ type: "SET_CONFIG_MODAL", open: false });
  }

  return (
    <Dialog open={state.configModalOpen} onClose={() => dispatch({ type: "SET_CONFIG_MODAL", open: false })} maxWidth="xs" fullWidth>
      <DialogTitle>API 配置</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <Select value={selectedId} onChange={(e) => selectProfile(e.target.value)} size="small" fullWidth>
            {profiles.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </Select>
          <IconButton onClick={handleAdd} size="small" color="primary"><AddIcon /></IconButton>
          <IconButton onClick={handleDelete} size="small" color="error"><DeleteIcon /></IconButton>
        </Box>
        <TextField label="配置名称" value={name} onChange={(e) => setName(e.target.value)} size="small" fullWidth sx={{ mb: 1.5 }} />
        <TextField label="API 地址" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} size="small" fullWidth sx={{ mb: 1.5 }} placeholder="https://www.packyapi.com" />
        <TextField label="API 密钥" value={apiKey} onChange={(e) => setApiKey(e.target.value)} size="small" fullWidth type="password" placeholder="sk-xxxxxx" />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, mb: 0.5, display: "block", fontWeight: 600 }}>自定义接口路径（高级）</Typography>
        <TextField label="文生图路径" value={generationsPath} onChange={(e) => setGenerationsPath(e.target.value)} size="small" fullWidth sx={{ mb: 1.5 }} placeholder={DEFAULT_GENERATIONS_PATH} />
        <TextField label="图生图路径" value={editsPath} onChange={(e) => setEditsPath(e.target.value)} size="small" fullWidth placeholder={DEFAULT_EDITS_PATH} />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>配置保存在浏览器本地</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => dispatch({ type: "SET_CONFIG_MODAL", open: false })}>取消</Button>
        <Button variant="contained" onClick={handleSave}>保存</Button>
      </DialogActions>
    </Dialog>
  );
}
