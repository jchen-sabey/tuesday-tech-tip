import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
css = (root / "css" / "styles.css").read_text(encoding="utf-8")
scenario = (root / "js" / "scenario.js").read_text(encoding="utf-8")
game = (root / "js" / "game.js").read_text(encoding="utf-8")
index = (root / "index.html").read_text(encoding="utf-8")

scenario_inline = re.sub(
    r"export const scenarioMeta = \{[\s\S]*?\};\s*\n?",
    "",
    scenario,
    count=1,
)
scenario_inline = scenario_inline.replace("export const beats", "const beats", 1)

game_inline = re.sub(
    r'^import \{ beats \} from "\./scenario\.js";\s*\r?\n',
    "",
    game,
    count=1,
    flags=re.MULTILINE,
)

script = scenario_inline.strip() + "\n\n" + game_inline.strip()

index = index.replace(
    '<link rel="stylesheet" href="css/styles.css" />',
    f"<style>\n{css}\n</style>",
)
index = index.replace(
    '<script type="module" src="js/game.js"></script>',
    f"<script>\n{script}\n</script>",
)

out = root / "prompt-orchestrator-standalone.html"
out.write_text(index, encoding="utf-8")
print("Wrote", out)
