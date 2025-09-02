var _a = require("fs"), readFileSync = _a.readFileSync, writeFileSync = _a.writeFileSync, mkdirSync = _a.mkdirSync;
var _b = require("path"), basename = _b.basename, join = _b.join;
var globSync = require("glob").globSync;
var outDir = process.argv[2] || "../server/src/blockchain/_abi";
mkdirSync(outDir, { recursive: true });
// Find all artifact JSONs (no top-level await)
var files = globSync("artifacts/contracts/**/*.json", { nodir: true });
var exported = 0;
for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
    var file = files_1[_i];
    try {
        var json = JSON.parse(readFileSync(file, "utf8"));
        if (!Array.isArray(json === null || json === void 0 ? void 0 : json.abi))
            continue; // only real contract artifacts
        var name_1 = basename(file).replace(/\.json$/, ".json");
        writeFileSync(join(outDir, name_1), JSON.stringify(json.abi, null, 2));
        exported++;
    }
    catch (err) {
        console.warn("Skipping bad artifact:", file);
    }
}
console.log("Exported ".concat(exported, " ABIs to ").concat(outDir));
