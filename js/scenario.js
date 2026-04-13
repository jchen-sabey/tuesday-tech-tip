/**
 * Universal scenario: drafting an important message with help. The details are
 * left open (work, school, housing, family, health admin - anything where words
 * carry weight). Same loop lessons: brief vs vague prompts, verification, iteration.
 */

export const scenarioMeta = {
  id: "important-message",
  title: "The message that matters",
};

/** @typedef {{ label: string; qualityDelta: number; next: string; deltaWhy: string }} Choice */
/** @typedef {{ id: string; title: string; body: string[]; choices: Choice[] }} Beat */

/** @type {Record<string, Beat>} */
export const beats = {
  start: {
    id: "start",
    title: "The blank screen",
    body: [
      "Someone is waiting on a message from you: clear, accurate, and on point. Email, portal, letter - whatever the channel, **mistakes mean extra rounds, lost time, and harder trust to earn back**.",
      "You reach for an assistant to draft. First beat of the **orchestrator loop**: what you ask for, what comes back, and what you do before anything goes out the door.",
    ],
    choices: [
      {
        label:
          'Paste a wall of context - old threads, half-remembered facts - and say "make it sound good."',
        qualityDelta: -12,
        next: "vague_prompt",
        deltaWhy: "A vague prompt gives the model room to invent or blur facts you never nailed down.",
      },
      {
        label:
          "Write a tight brief: who it is for, what you need them to know or do, tone, length, and facts that must stay exact.",
        qualityDelta: 10,
        next: "clear_brief",
        deltaWhy: "A tight brief narrows what can go wrong before the first word is generated.",
      },
      {
        label:
          'Skip the body for now; ask for "10 opening lines" just to get something on the screen.',
        qualityDelta: 3,
        next: "subject_first",
        deltaWhy: "A small, scoped run is okay - as long as you plan to anchor the real message next.",
      },
    ],
  },

  vague_prompt: {
    id: "vague_prompt",
    title: "A confident first draft",
    body: [
      "The draft reads smooth and sure. Then you spot the problems: a date that is off, a name spelled wrong, and a sentence that quietly **commits you to something you did not intend**.",
      "Lesson in one line: a mushy **prompt** often produces a confident **result** - which is exactly when mistakes hide in plain sight.",
    ],
    choices: [
      {
        label: "Send it; you will clean up any mix-ups if they show up later.",
        qualityDelta: -18,
        next: "end_regret",
        deltaWhy: "Sending unverified text usually costs more time in corrections and chips away at credibility.",
      },
      {
        label: "Stop. Re-prompt: list the non-negotiable facts and forbid anything not grounded in what you provided.",
        qualityDelta: 8,
        next: "verify_pass",
        deltaWhy: "You used Decide to tighten the prompt around facts you control - risk drops fast.",
      },
      {
        label: "Throw the draft away and write the whole message alone, without using the loop again.",
        qualityDelta: -5,
        next: "end_burnout",
        deltaWhy: "The message may be fine, but you skip practice at steering the loop - next time is harder.",
      },
    ],
  },

  clear_brief: {
    id: "clear_brief",
    title: "A plain, faithful draft",
    body: [
      "The text follows your structure. A few sentences feel stiff, but the facts you named are still there, unchanged.",
      "Nice work: tight constraints in the **prompt** meant fewer surprises in the **result** - less to verify, less to fix.",
    ],
    choices: [
      {
        label: "Ask for one revision: warmer tone and shorter sentences - same facts, same length.",
        qualityDelta: 20,
        next: "iterate_well",
        deltaWhy: "A narrow revision pass improves tone without touching truth - textbook small iteration.",
      },
      {
        label: "Copy it out and send immediately, no last read.",
        qualityDelta: -4,
        next: "end_rushed",
        deltaWhy: "Skipping a final read leaves silent errors and sloppy wording on the record.",
      },
    ],
  },

  subject_first: {
    id: "subject_first",
    title: "Strong openings, shaky spine",
    body: [
      'You get memorable first lines - but there is still no full message. Along the way, the assistant invented "helpful" details that were never true.',
      "Even a quick **run** needs a target: every step should tie back to what you actually need to say.",
    ],
    choices: [
      {
        label:
          "Pick a direction, then run a second prompt that only allows the points you already approved.",
        qualityDelta: 7,
        next: "clear_brief",
        deltaWhy: "You locked the spine before expanding - the next prompt has real guardrails.",
      },
      {
        label: "Choose an opening and ask for the full message in one go, without locking your main points.",
        qualityDelta: -6,
        next: "vague_prompt",
        deltaWhy: "One big ask without fixed points drifts back toward mushy prompts and shaky output.",
      },
    ],
  },

  verify_pass: {
    id: "verify_pass",
    title: "Verification round",
    body: [
      'You add: "Flag anything uncertain; do not add facts I did not give." The assistant labels one line as guessed - you cut it and swap in a line you would sign your name to.',
      "**Quality** climbs when you use the **Decide** step to verify the output against reality - not to stop because it merely sounds good.",
    ],
    choices: [
      {
        label:
          "Send the message and, where it makes sense, note that you used drafting help and checked the facts yourself.",
        qualityDelta: 12,
        next: "end_transparent",
        deltaWhy: "Clear attribution plus checked facts saves everyone time and protects trust.",
      },
    ],
  },

  iterate_well: {
    id: "iterate_well",
    title: "Tight iteration",
    body: [
      "The second version reads better. The facts are untouched. You spend a few minutes instead of an hour rewriting from zero.",
      "That is the loop doing its job: **prompt -> run -> result -> decide** (repeat), in small, low-risk hops.",
    ],
    choices: [
      {
        label: "Save your brief as a template for the next time words really matter.",
        qualityDelta: 20,
        next: "end_sustainable",
        deltaWhy: "Turning today's brief into a template makes the next loop faster and safer.",
      },
    ],
  },

  end_regret: {
    id: "end_regret",
    title: "Ending: the cleanup",
    body: [
      "Your calendar fills with clarifications, corrections, and re-sent details - work you would not have needed if the first message had been tight. Each back-and-forth chips away at how credible the next thing you send sounds.",
      "Worth another run: small changes earlier in the loop usually cost less than repair work later.",
    ],
    choices: [
      {
        label: "Play again",
        qualityDelta: 0,
        next: "start",
        deltaWhy: "Quality reset to 50 - try another path through the story.",
      },
    ],
  },

  end_burnout: {
    id: "end_burnout",
    title: "Ending: you carried it all",
    body: [
      "The message went out, but this time you did not get much lift from the loop - same outcome, more solo effort. Next time, a lighter touch on prompting might save you hours.",
    ],
    choices: [
      {
        label: "Play again",
        qualityDelta: 0,
        next: "start",
        deltaWhy: "Quality reset to 50 - try another path through the story.",
      },
    ],
  },

  end_rushed: {
    id: "end_rushed",
    title: "Ending: probably fine",
    body: [
      "No urgent fires - today. You still skipped a proper **decide** pass, so you shipped text you did not fully re-read. That is free risk on the table for next time.",
    ],
    choices: [
      {
        label: "Play again",
        qualityDelta: 0,
        next: "start",
        deltaWhy: "Quality reset to 50 - try another path through the story.",
      },
    ],
  },

  end_transparent: {
    id: "end_transparent",
    title: "Ending: trust intact",
    body: [
      "They know which parts you stand behind and how you checked them. That clarity saves time on both sides and makes the next exchange easier to trust.",
    ],
    choices: [
      {
        label: "Play again",
        qualityDelta: 0,
        next: "start",
        deltaWhy: "Quality reset to 50 - try another path through the story.",
      },
    ],
  },

  end_sustainable: {
    id: "end_sustainable",
    title: "Ending: a habit, not a one-off",
    body: [
      "You have a reusable brief, a quick checklist before you hit send, and a habit of small iterations. That is orchestration - and you can drop the same pattern into the next message that actually matters.",
    ],
    choices: [
      {
        label: "Play again",
        qualityDelta: 0,
        next: "start",
        deltaWhy: "Quality reset to 50 - try another path through the story.",
      },
    ],
  },
};
