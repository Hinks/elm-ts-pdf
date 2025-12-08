#!/usr/bin/env node

import esbuild from "esbuild";
import elmPlugin from "esbuild-plugin-elm";
import { lessLoader } from "esbuild-plugin-less";
import fs from "fs";
import path from "path";

const PROJECT_ROOT = process.cwd();
const CLIENT_DIR = path.join(PROJECT_ROOT, "src/client");
const DEST_DIR = path.join(PROJECT_ROOT, "dist/static");

const elmBuildOptions = {
    absWorkingDir: CLIENT_DIR,
    entryPoints: {
        "js/main": "elm/Main.elm",
    },
    bundle: false,
    outdir: path.join(DEST_DIR, "assets"),
    minifyWhitespace: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    sourcemap: true,
    plugins: [
        elmPlugin({
            debug: true,
            verbose: true,
            optimize: false,
            cwd: CLIENT_DIR,
        }),
    ],
};

const lessBuildOptions = {
    absWorkingDir: CLIENT_DIR,
    entryPoints: {
        "css/index": "index.less",
    },
    bundle: true,
    outdir: path.join(DEST_DIR, "assets"),
    minifyWhitespace: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    sourcemap: true,
    plugins: [lessLoader()],
};

async function copyIndexHtml() {
    const htmlSource = path.join(CLIENT_DIR, "index.html");
    const htmlDest = path.join(DEST_DIR, "index.html");

    await fs.promises.copyFile(htmlSource, htmlDest);
    console.log("✓ Copied index.html:", htmlDest);
}

async function build() {
    // Remove destination directory if it exists
    await fs.promises.rm(DEST_DIR, { recursive: true, force: true });
    console.log("✓ Cleaned dist/static folder");

    console.log("Building Elm...");
    await esbuild.build(elmBuildOptions);
    console.log("Building Less...");
    await esbuild.build(lessBuildOptions);
    console.log("Copying index.html...");
    await copyIndexHtml();
    console.log("Build completed successfully!");
}

async function watch() {
    // Clean dist folder initially
    await fs.promises.rm(DEST_DIR, { recursive: true, force: true });
    console.log("✓ Cleaned dist/static folder");

    // Create contexts for watching
    const elmCtx = await esbuild.context(elmBuildOptions);
    const lessCtx = await esbuild.context(lessBuildOptions);

    // Do initial builds
    console.log("Building Elm...");
    await elmCtx.rebuild();
    console.log("Building Less...");
    await lessCtx.rebuild();
    console.log("Copying index.html...");
    await copyIndexHtml();

    // Watch for changes
    await elmCtx.watch();
    await lessCtx.watch();

    // Watch for index.html changes
    const htmlSource = path.join(CLIENT_DIR, "index.html");
    fs.watch(htmlSource, async () => {
        console.log("index.html changed, copying...");
        await copyIndexHtml();
    });

    console.log("Watching for changes...");
}

// Check for watch flag
const isWatchMode =
    process.argv.includes("--watch") || process.argv.includes("-w");

if (isWatchMode) {
    watch();
} else {
    build();
}
