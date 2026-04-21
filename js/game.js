import { beats } from "./scenario.js";

const INITIAL_QUALITY = 50;
const QUALITY_MIN = 0;
const QUALITY_MAX = 100;
const LOOP_STEPS = ["Prompt", "Analyze", "Make Changes", "Evaluate"];

for (const beat of Object.values(beats)) {
  const choices = Array.isArray(beat.choices) ? beat.choices : [];
  const isPlayAgainEnding =
    choices.length === 1 && typeof choices[0]?.label === "string" && choices[0].label.trim() === "Play again";
  if (choices.length < 2 && !isPlayAgainEnding) {
    console.error(`Beat "${beat.id}" must define at least 2 choices unless it is a Play again ending.`);
  }
}

/** @param {number} w */
function qualityBand(w) {
  if (w < 25) return { label: "Critical", hint: "Trust and accuracy are taking a hit - slow the loop down next round." };
  if (w < 45) return { label: "Shaky", hint: "One sloppy lap can mean a lot of cleanup - tighten prompts or verify more." };
  if (w < 65) return { label: "Stable", hint: "You are treading water: fine for now, room to improve." };
  if (w < 85) return { label: "Strong", hint: "Small good habits are stacking; keep going." };
  return { label: "Thriving", hint: "The loop is buying you time and fewer surprises." };
}

function setLoopPhase(phaseIndex) {
  document.querySelectorAll(".loop-step").forEach((el, i) => {
    el.classList.toggle("is-active", i === phaseIndex);
  });
}

/** @param {number} q */
function qualityTier(q) {
  if (q < 45) return "low";
  if (q < 65) return "mid";
  return "high";
}

/** @param {number} quality */
function renderQuality(quality) {
  const clamped = Math.max(QUALITY_MIN, Math.min(QUALITY_MAX, quality));
  const band = qualityBand(clamped);
  const tier = qualityTier(clamped);

  const valueEl = document.getElementById("quality-value");
  const fillEl = document.getElementById("quality-fill");
  const hintEl = document.getElementById("quality-hint");
  const barEl = document.getElementById("quality-bar-wrap");

  valueEl.textContent = String(clamped);
  valueEl.className = "quality__value";
  valueEl.classList.add(`quality__value--${tier}`);

  fillEl.style.width = `${clamped}%`;
  fillEl.className = "quality__fill";
  fillEl.classList.add(`quality__fill--${tier}`);

  hintEl.textContent = `${band.label} - ${band.hint}`;
  barEl.setAttribute("aria-valuenow", String(clamped));
}

/** @param {{ qualityDelta: number; next: string; deltaWhy: string }} choice */
function showChoiceQualityNote(choice) {
  const el = document.getElementById("quality-delta");
  if (!el) return;

  if (choice.next === "start") {
    el.textContent = choice.deltaWhy;
    el.hidden = false;
    el.classList.remove("quality__delta--up", "quality__delta--down", "quality__delta--neutral");
    el.classList.add("quality__delta--neutral");
    return;
  }

  const d = choice.qualityDelta;
  let line;
  if (d === 0) {
    line = choice.deltaWhy;
    el.classList.remove("quality__delta--up", "quality__delta--down");
    el.classList.add("quality__delta--neutral");
  } else if (d > 0) {
    line = `+${d} - ${choice.deltaWhy}`;
    el.classList.remove("quality__delta--down", "quality__delta--neutral");
    el.classList.add("quality__delta--up");
  } else {
    line = `${d} - ${choice.deltaWhy}`;
    el.classList.remove("quality__delta--up", "quality__delta--neutral");
    el.classList.add("quality__delta--down");
  }

  el.textContent = line;
  el.hidden = false;
}

function clearChoiceQualityNote() {
  const el = document.getElementById("quality-delta");
  if (!el) return;
  el.hidden = true;
  el.textContent = "";
  el.classList.remove("quality__delta--up", "quality__delta--down", "quality__delta--neutral");
}

/** @param {string} beatId */
function renderBeat(beatId) {
  const beat = beats[beatId];
  if (!beat) {
    console.error("Unknown beat:", beatId);
    return;
  }

  const phaseIndex = state.loopStep % 4;
  setLoopPhase(phaseIndex);

  document.getElementById("scene-meta").textContent = `Loop: ${LOOP_STEPS[phaseIndex]}`;
  document.getElementById("scene-title").textContent = beat.title;

  const bodyEl = document.getElementById("scene-body");
  bodyEl.innerHTML = beat.body
    .map((p) => `<p>${p.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</p>`)
    .join("");

  const choicesLabelEl = document.getElementById("choices-label");
  if (choicesLabelEl) {
    choicesLabelEl.hidden = beat.choices.length < 2;
  }

  const choicesEl = document.getElementById("choices");
  choicesEl.innerHTML = "";
  beat.choices.forEach((c) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice-btn";
    btn.textContent = c.label;
    btn.addEventListener("click", () => {
      if (c.next === "start") {
        state.quality = INITIAL_QUALITY;
        state.loopStep = 0;
      } else {
        state.quality += c.qualityDelta;
        state.loopStep += 1;
      }
      showChoiceQualityNote(c);
      renderQuality(state.quality);
      renderBeat(c.next);
    });
    choicesEl.appendChild(btn);
  });
}

const state = {
  quality: INITIAL_QUALITY,
  loopStep: 0,
};

const introScreen = document.getElementById("intro-screen");
const gameRoot = document.getElementById("game-root");
const introStartBtn = document.getElementById("intro-start");

introStartBtn.addEventListener("click", () => {
  introScreen.hidden = true;
  gameRoot.hidden = false;
  clearChoiceQualityNote();
  renderQuality(state.quality);
  renderBeat("start");
  document.getElementById("choices")?.querySelector("button")?.focus();
});
