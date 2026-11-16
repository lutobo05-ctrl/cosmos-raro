import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const chromiumOptions = { gl: "swangle" }, browserExecutable = "/usr/bin/google-chrome";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
for (const [name, extra] of [["base", {}], ["base2", {}]]) {
  const inputProps = { mute: true, ...extra };
  const composition = await selectComposition({ serveUrl, id: "Venus", chromiumOptions, inputProps, browserExecutable });
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: 1300, output: `out/prof_${name}.jpg`, imageFormat: "jpeg", scale: 1, chromiumOptions, inputProps, browserExecutable, timeoutInMilliseconds: 400000 });
  console.log(name, ((Date.now() - t0) / 1000).toFixed(1));
}
