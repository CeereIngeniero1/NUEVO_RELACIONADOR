const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function replaceInFile(rel) {
  const f = path.join(root, rel);
  let s = fs.readFileSync(f, "utf8");
  const orig = s;
  s = s.split("http://${servidor}:3000").join("${getApiBaseUrl()}");
  if (s !== orig) {
    fs.writeFileSync(f, s);
    console.log("updated", rel);
  } else {
    console.log("no change", rel);
  }
}

const batch = [
  "public/Asignar_RIPS V3.js",
  "public/Asignar_RIPS V3 experimental.js",
  "public/RIPS.js",
  "public/RIPS V2.js",
  "public/MaestroListasRIPS.js",
  "public/Asignar_RIPS.js",
  "public/Asignar_RIPS V2.js",
  "public/Asignar_RIPS V3.html",
];
for (const rel of batch) replaceInFile(rel);
