const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const files = ["public/RIPS.js", "public/RIPS V2.js", "public/MaestroListasRIPS.js"];

for (const rel of files) {
  const f = path.join(root, rel);
  let s = fs.readFileSync(f, "utf8");
  const orig = s;
  s = s.replace(/\bgetApiBaseUrl\(/g, "window.getApiBaseUrl(");
  if (s !== orig) {
    fs.writeFileSync(f, s);
    console.log("fixed", rel);
  }
}
