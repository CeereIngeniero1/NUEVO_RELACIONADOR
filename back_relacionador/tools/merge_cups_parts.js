/**
 * Une _cups_part_*.raw (salida de lectura con prefijo de línea) en Cups.json
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../SQL/1888/CODESYSTEM');
const parts = fs.readdirSync(dir)
    .filter((f) => /^_cups_part_\d+\.raw$/.test(f))
    .sort((a, b) => {
        const na = Number(a.match(/\d+/)[0]);
        const nb = Number(b.match(/\d+/)[0]);
        return na - nb;
    });

if (!parts.length) {
    console.error('No hay archivos _cups_part_*.raw en', dir);
    process.exit(1);
}

let out = '';
for (const f of parts) {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    out += raw.split(/\r?\n/).map((line) => {
        const m = line.match(/^\s*\d+\|(.*)$/);
        return m ? m[1] : line;
    }).join('\n');
}

const outPath = path.join(dir, 'Cups.json');
fs.writeFileSync(outPath, out, 'utf8');
console.log('Cups.json escrito:', outPath, 'bytes:', fs.statSync(outPath).size);

for (const f of parts) {
    fs.unlinkSync(path.join(dir, f));
}
