// usage: node pruebas/render.mjs <compId> <out.mp4> <from> <to> [scale] [concurrency]
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [id, out, from, to, scale = "1", conc = "2"] = process.argv.slice(2);
const chromiumOptions = { gl: process.env.GL || "swangle" }, browserExecutable = "/usr/bin/google-chrome", inputProps = { mute: true };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id, chromiumOptions, inputProps, browserExecutable });
const t0 = Date.now(); let last = 0;
await renderMedia({ composition, serveUrl, codec: "h264", crf: 16, outputLocation: out, frameRange: [Number(from), Number(to)],
  scale: Number(scale), concurrency: Number(conc), chromiumOptions, inputProps, browserExecutable, muted: true, timeoutInMilliseconds: 600000,
  onProgress: ({ renderedFrames }) => { if (renderedFrames - last >= 20) { last = renderedFrames; console.log(`${id} ${from}-${to}: ${renderedFrames} frames ${((Date.now() - t0) / 1000).toFixed(0)}s`); } } });
console.log("done", out, ((Date.now() - t0) / 1000).toFixed(0) + "s");
