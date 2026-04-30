import { StrictMode, useState, useMemo, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { darkTheme, lightTheme } from "./theme/theme";
import { AppProvider } from "./context/AppContext";
import { openDB } from "./services/db";
import { LS_THEME_KEY } from "./services/config";
import AppLayout from "./components/AppLayout";
import GeneratePage from "./components/GeneratePage";
import GalleryPage from "./components/GalleryPage";
import Lightbox from "./components/Lightbox";

await openDB();

function Root() {
  const [mode, setMode] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem(LS_THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const theme = useMemo(() => (mode === "dark" ? darkTheme : lightTheme), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider themeMode={mode} setThemeMode={setMode}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/generate" replace />} />
              <Route path="generate" element={<GeneratePage />} />
              <Route path="gallery" element={<GalleryPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Lightbox />
      </AppProvider>
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
