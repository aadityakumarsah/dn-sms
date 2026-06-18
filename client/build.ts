import tailwind from "bun-plugin-tailwind";
import { rm } from "node:fs/promises";
import path from "node:path";

const outdir = path.join(process.cwd(), "dist");
await rm(outdir, { recursive: true, force: true });

// Build frontend.tsx directly so Bun correctly identifies the entry chunk.
// Using HTML as entrypoint with splitting:true causes Bun to reference the
// wrong shared chunk in index.html, so the app never mounts.
const result = await Bun.build({
  entrypoints: ["src/frontend.tsx"],
  outdir,
  plugins: [tailwind],
  minify: true,
  target: "browser",
  sourcemap: "linked",
  splitting: true,
  naming: {
    entry: "entry-[hash].[ext]",
    chunk: "chunk-[hash].[ext]",
    asset: "[name]-[hash].[ext]",
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env.PUBLIC_API_URL": JSON.stringify(process.env.PUBLIC_API_URL ?? ""),
  },
});

// Find the entry JS and CSS outputs, then patch index.html to reference them.
const entry = result.outputs.find((o) => o.kind === "entry-point" && o.path.endsWith(".js"));
const css = result.outputs.find((o) => o.path.endsWith(".css"));
if (!entry) throw new Error("Build failed: no entry-point output found");

const entryFile = path.relative(outdir, entry.path);
const cssFile = css ? path.relative(outdir, css.path) : null;

const srcHtml = await Bun.file("src/index.html").text();
let distHtml = srcHtml.replace(
  /<script[^>]*src="[^"]*frontend\.tsx"[^>]*><\/script>/,
  `<script type="module" crossorigin src="./${entryFile}"></script>`
);
if (cssFile) {
  distHtml = distHtml.replace(
    "</head>",
    `  <link rel="stylesheet" crossorigin href="./${cssFile}">\n</head>`
  );
}
await Bun.write(path.join(outdir, "index.html"), distHtml);

for (const output of result.outputs) {
  console.log(` ${path.relative(process.cwd(), output.path)}  ${(output.size / 1024).toFixed(1)} KB`);
}
console.log(` dist/index.html  (entry: ${entryFile}, css: ${cssFile ?? "none"})`);
