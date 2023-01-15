const esbuild = require("esbuild");
const fs = require("fs");

esbuild
  .build({
    entryPoints: ["../dist/html2svelte/index.js"],
    outdir: "bundle",
    bundle: true,
    sourcemap: false,
    minify: false,
    splitting: true,
    format: "esm",
    target: ["esnext"],
  })
  .then(() => {
    // read the file above as a string
    const esbuildFile = fs.readFileSync("./bundle/index.js", "utf8");
    const esbuildFileFixed = esbuildFile.replace(
      "export default",
      "const html2svelte =" // this is the fix
    );
    // write the file back to disk overwriting the original
    fs.writeFileSync("./bundle/index.js", esbuildFileFixed);
  })
  .catch(() => process.exit(1));
