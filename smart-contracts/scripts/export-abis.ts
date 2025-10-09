const { readFileSync, writeFileSync, mkdirSync } = require("fs");
const { basename, join } = require("path");
const { globSync } = require("glob");

const outDir = process.argv[2] || "../server/src/blockchain/_abi";
mkdirSync(outDir, { recursive: true });

const files = globSync("artifacts/contracts/**/*.json", { nodir: true });

let exported = 0;
for (const file of files) {
  try {
    const json = JSON.parse(readFileSync(file, "utf8"));
    if (!Array.isArray(json?.abi)) continue; // only real contract artifacts
    const name = basename(file).replace(/\.json$/, ".json");
    writeFileSync(join(outDir, name), JSON.stringify(json.abi, null, 2));
    exported++;
  } catch (err) {
    console.warn("Skipping bad artifact:", file);
  }
}

console.log(`Exported ${exported} ABIs to ${outDir}`);