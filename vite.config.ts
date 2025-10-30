import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  // مهم لـ GitHub Pages:
  base: mode === "production" ? "/real-school-hub/" : "/",

  server: { host: "::", port: 8080 },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },

  // اختر واحدًا من مساري النشر بالأسفل:
  // لو ستنشر من مجلد docs، فعّل السطر التالي:
  // build: { outDir: "docs" },
}));
