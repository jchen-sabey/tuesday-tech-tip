import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const css = fs.readFileSync(path.join(root, "css", "styles.css"), "utf8");
const scenario = fs.readFileSync(path.join(root, "js", "scenario.js"), "utf8");
const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
let index = fs.readFileSync(path.join(root, "index.html"), "utf8");

const scenarioInline = scenario
  .replace(/export const scenarioMeta = \{[\s\S]*?\};\s*\n?/, "")
  .replace("export const beats", "const beats");

const gameInline = game.replace(/^import \{ beats \} from "\.\/scenario\.js";\s*\r?\n/m, "");

const script = `${scenarioInline.trim()}\n\n${gameInline.trim()}`;

index = index.replace(
  /<link rel="stylesheet" href="css\/styles\.css" \/>/,
  `<style>\n${css}\n</style>`
);
index = index.replace(
  /<script type="module" src="js\/game\.js"><\/script>/,
  `<script>\n${script}\n</script>`
);

const out = path.join(root, "prompt-orchestrator-standalone.html");
fs.writeFileSync(out, index, "utf8");
console.log("Wrote", out);
