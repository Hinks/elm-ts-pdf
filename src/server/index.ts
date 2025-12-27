import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { handlePdfRoute } from "../pdf/pdf-route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the project root directory (works from both src/server and dist/server)
const projectRoot = path.resolve(__dirname, "../..");
const staticDir = path.join(projectRoot, "dist", "static");
const pdfsDir = path.join(projectRoot, "pdfs");

// Ensure pdfs directory exists
if (!fs.existsSync(pdfsDir)) {
    fs.mkdirSync(pdfsDir, { recursive: true });
}

const app = express();
const PORT = process.env["PORT"] || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
// API route
app.get("/api", (_req: Request, res: Response): void => {
    res.json({ message: "hey from api" });
});

// Ping route - responds immediately to verify non-blocking behavior
app.get("/ping", (_req: Request, res: Response): void => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        message: "Server is responsive",
    });
});

// PDF generation route - uses worker pool
app.post("/pdf", (req: Request, res: Response): void => {
    void handlePdfRoute(req, res, pdfsDir);
});

// Serve static index.html at root
app.get("/", (_req: Request, res: Response): void => {
    res.sendFile(path.join(staticDir, "index.html"));
});

// Serve static assets
app.use("/assets", express.static(path.join(staticDir, "assets")));

// Start server
app.listen(PORT, (): void => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
