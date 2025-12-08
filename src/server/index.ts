import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the project root directory (works from both src/server and dist/server)
const projectRoot = path.resolve(__dirname, "../..");
const staticDir = path.join(projectRoot, "dist", "static");

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
