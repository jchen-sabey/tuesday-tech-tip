(function () {
  const data = window.surveySummaryData;

  if (!data || !Array.isArray(data.responses)) {
    document.body.innerHTML =
      '<main class="page-shell"><p class="empty-state">Survey data could not be loaded.</p></main>';
    return;
  }

  const selectors = {
    stats: document.getElementById("metric-grid"),
    deck: document.getElementById("story-deck"),
    previous: document.getElementById("slide-prev"),
    next: document.getElementById("slide-next"),
    slideCount: document.getElementById("slide-count"),
    slideDots: document.getElementById("slide-dots"),
    sourceCount: document.getElementById("source-response-count"),
    sourceName: document.getElementById("source-name"),
    sourceDate: document.getElementById("source-date"),
  };

  let currentSlide = 0;
  let slideTotal = 0;

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function plural(count, singular, pluralLabel) {
    return `${count} ${count === 1 ? singular : pluralLabel || `${singular}s`}`;
  }

  function getValues(response, key) {
    const value = response[key];
    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }
    return value ? [value] : [];
  }

  function countBy(responses, key) {
    const counts = new Map();
    responses.forEach((response) => {
      getValues(response, key).forEach((value) => {
        counts.set(value, (counts.get(value) || 0) + 1);
      });
    });

    return Array.from(counts, ([label, count]) => ({ label, count })).sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.label.localeCompare(b.label);
    });
  }

  function countWhere(responses, key, predicate) {
    return responses.reduce((total, response) => total + (predicate(response[key] || "") ? 1 : 0), 0);
  }

  function formatPercent(count, total) {
    if (!total) {
      return "0%";
    }
    return `${Math.round((count / total) * 100)}%`;
  }

  function topItem(responses, key) {
    return countBy(responses, key)[0] || { label: "No responses in this slice yet", count: 0 };
  }

  function renderStats(responses) {
    const total = responses.length;
    const readyCount = countWhere(responses, "trainingInterest", (value) => {
      return (
        value.includes("ready now") ||
        value.includes("building skills") ||
        value.includes("highly specialized")
      );
    });
    const topEnhancement = topItem(responses, "enhancements");
    const topChallenge = topItem(responses, "challenges");

    selectors.stats.innerHTML = [
      statTile(
        "Voices heard",
        String(data.responseCount),
        "responses",
        "The full survey response set is included."
      ),
      statTile(
        "Level-up energy",
        formatPercent(readyCount, total),
        `${readyCount}/${total || 0}`,
        "Ready now, building toward advanced, or asking for specialized sessions."
      ),
      statTile(
        "Top AI wish",
        topEnhancement.count ? String(topEnhancement.count) : "0",
        topEnhancement.count ? "votes" : "votes",
        topEnhancement.label
      ),
      statTile(
        "Top speed bump",
        topChallenge.count ? String(topChallenge.count) : "0",
        topChallenge.count ? "votes" : "votes",
        topChallenge.label
      ),
    ].join("");
  }

  function statTile(label, value, suffix, note) {
    return `
      <article class="stat-tile">
        <p class="stat-label">${escapeHtml(label)}</p>
        <p class="stat-value">${escapeHtml(value)} <span>${escapeHtml(suffix)}</span></p>
        <p class="stat-note">${escapeHtml(note)}</p>
      </article>
    `;
  }

  function rankList(items, responses, limit = 5) {
    const total = responses.length;
    const sliced = items.slice(0, limit);

    if (!sliced.length || !total) {
      return '<p class="empty-state">No responses were available for this section.</p>';
    }

    return `
      <ol class="rank-list">
        ${sliced
          .map(
            (item, index) => `
              <li class="rank-row">
                <span class="rank-number">#${index + 1}</span>
                <span class="rank-label">${escapeHtml(item.label)}</span>
                <span class="rank-count">${item.count}<span>${formatPercent(item.count, total)}</span></span>
              </li>
            `
          )
          .join("")}
      </ol>
    `;
  }

  function storyCard({ theme, kicker, title, copy, body, note }) {
    return `
      <article class="story-card story-card--${theme}">
        <div class="story-body">
          <div>
            <p class="story-kicker">${escapeHtml(kicker)}</p>
            <h2 class="story-title">${title}</h2>
          </div>
          ${copy ? `<p class="story-copy">${escapeHtml(copy)}</p>` : ""}
          ${body || ""}
          ${note ? `<p class="mini-note">${escapeHtml(note)}</p>` : ""}
        </div>
      </article>
    `;
  }

  function bigNumber(value, label) {
    return `<p class="big-number">${escapeHtml(value)}<span>${escapeHtml(label)}</span></p>`;
  }

  function renderTopWishCard(responses) {
    const enhancements = countBy(responses, "enhancements");
    const leaders = enhancements.slice(0, 3);
    const tieCount = leaders.length
      ? leaders.filter((item) => item.count === leaders[0].count).length
      : 0;
    const title =
      tieCount >= 3
        ? 'The top AI wish list was a <strong>three-way tie</strong>.'
        : 'The top AI wish was <strong>loud and clear</strong>.';
    const copy =
      tieCount >= 3
        ? "Reporting, writing, and automation all landed at the front of the line."
        : `${leaders[0]?.label || "The top request"} led the pack.`;

    return storyCard({
      theme: "hot",
      kicker: "Result 01",
      title,
      copy,
      body: rankList(enhancements, responses, 5),
    });
  }

  function renderSpeedBumpCard(responses) {
    const challenges = countBy(responses, "challenges");
    const top = challenges[0] || { count: 0, label: "No clear speed bump" };

    return storyCard({
      theme: "acid",
      kicker: "Result 02",
      title: `The biggest speed bump was <strong>${escapeHtml(top.label)}</strong>.`,
      copy:
        "The pattern is not resistance to learning. It is friction: time, uncertainty, trust, and tools that are not yet close enough to the workflow.",
      body: rankList(challenges, responses, 6),
    });
  }

  function renderLevelUpCard(responses) {
    const total = responses.length;
    const readyCount = countWhere(responses, "trainingInterest", (value) => {
      return (
        value.includes("ready now") ||
        value.includes("building skills") ||
        value.includes("highly specialized")
      );
    });

    return storyCard({
      theme: "cool",
      kicker: "Result 03",
      title: '<strong>Interest in deeper training</strong> is real.',
      copy:
        "Most respondents are either ready for advanced hands-on work, building toward it, or interested when the session is specialized enough.",
      body: bigNumber(formatPercent(readyCount, total), "are open to deeper or more specialized training"),
    });
  }

  function renderMakeItClickCard(responses) {
    const drivers = countBy(responses, "valueDrivers");

    return storyCard({
      theme: "violet",
      kicker: "Result 04",
      title: 'What would make training click? <strong>Make it real.</strong>',
      copy:
        "The feedback keeps pointing back to the same thing: show examples from actual roles, teams, and workflows.",
      body: rankList(drivers, responses, 6),
    });
  }

  function renderFormatCard(responses) {
    const formats = countBy(responses, "formats");
    const winner = formats[0] || { count: 0, label: "Hands-on learning" };

    return storyCard({
      theme: "blue",
      kicker: "Result 05",
      title: `The format winner: <strong>${escapeHtml(winner.label)}</strong>.`,
      copy:
        "People want to try the thing, not just hear about the thing. Short tips and self-paced follow-ups help the learning stick.",
      body: rankList(formats, responses, 5),
    });
  }

  function renderAdvancedTrainingCard(responses) {
    const skills = countBy(responses, "advancedSkills");
    const outcomes = countBy(responses, "outcomes");

    return storyCard({
      theme: "ink",
      kicker: "Result 06",
      title: 'Advanced training should focus on <strong>workflows</strong>, not theory.',
      body: `
        <div class="split-grid">
          <div>
            <p class="story-copy">Most requested advanced skills</p>
            ${rankList(skills, responses, 5)}
          </div>
          <div>
            <p class="story-copy">Outcomes people want</p>
            ${rankList(outcomes, responses, 5)}
          </div>
        </div>
      `,
    });
  }

  function renderToolsCard(responses) {
    return storyCard({
      theme: "acid",
      kicker: "Result 07",
      title: 'The most-used tools are already <strong>clear</strong>.',
      copy:
        "ChatGPT, Copilot, and Fellow are already in the mix, so the next step is helping people choose the right tool for the job.",
      body: rankList(countBy(responses, "tools"), responses, 6),
    });
  }

  function renderThemesCard() {
    return storyCard({
      theme: "cool",
      kicker: "Open comments",
      title: 'The written feedback had <strong>clear themes</strong>.',
      copy:
        "When people wrote in their own words, the most concrete ideas clustered around real operational work.",
      body: `
        <ul class="theme-list">
          ${data.textThemes
            .map(
              (theme) => `
                <li>
                  <h3>${escapeHtml(theme.title)}</h3>
                  <p>${theme.examples.map(escapeHtml).join(" | ")}</p>
                </li>
              `
            )
            .join("")}
        </ul>
      `,
    });
  }

  function renderFinalCard(responses) {
    const total = responses.length;
    return storyCard({
      theme: "ink",
      kicker: "Recommendation",
      title: "So, what should we build next?",
      body: `
        <div class="final-panel">
          <p class="story-copy">
            Based on ${plural(total, "response")}, the winning formula is practical, role-specific, and reusable.
          </p>
          <ul class="recommendation-list">
            ${data.recommendations
              .map(
                (item) => `
                  <li>
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.summary)}</p>
                    <div class="tag-line">
                      ${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
                    </div>
                  </li>
                `
              )
              .join("")}
          </ul>
        </div>
      `,
      note:
        "Translation: less generic AI training, more guided practice with the work people actually recognize.",
    });
  }

  function renderDeck(responses) {
    const slides = [
      renderTopWishCard(responses),
      renderSpeedBumpCard(responses),
      renderLevelUpCard(responses),
      renderMakeItClickCard(responses),
      renderFormatCard(responses),
      renderAdvancedTrainingCard(responses),
      renderToolsCard(responses),
      renderThemesCard(),
      renderFinalCard(responses),
    ];

    selectors.deck.innerHTML = slides
      .map((slide, index) =>
        slide.replace(/<article class="([^"]+)"/, `<article class="$1" data-slide="${index}" tabindex="-1"`)
      )
      .join("");
    slideTotal = slides.length;
    currentSlide = Math.min(currentSlide, slideTotal - 1);
    renderSlideDots();
    updateSlide();
  }

  function getSlideCards() {
    return Array.from(selectors.deck.querySelectorAll(".story-card"));
  }

  function renderSlideDots() {
    selectors.slideDots.innerHTML = Array.from({ length: slideTotal }, (_, index) => {
      return `<button class="slide-dot" type="button" data-slide-target="${index}" aria-label="Go to result ${index + 1}"></button>`;
    }).join("");

    selectors.slideDots.querySelectorAll(".slide-dot").forEach((dot) => {
      dot.addEventListener("click", () => {
        goToSlide(Number(dot.dataset.slideTarget), true);
      });
    });
  }

  function updateSlide(shouldFocus = false) {
    const cards = getSlideCards();

    cards.forEach((card, index) => {
      const isActive = index === currentSlide;
      card.hidden = !isActive;
      card.setAttribute("aria-hidden", String(!isActive));
    });

    selectors.previous.disabled = currentSlide === 0;
    selectors.next.disabled = currentSlide === slideTotal - 1;
    selectors.slideCount.textContent = `Result ${currentSlide + 1} of ${slideTotal}`;

    selectors.slideDots.querySelectorAll(".slide-dot").forEach((dot, index) => {
      dot.classList.toggle("is-active", index === currentSlide);
      dot.setAttribute("aria-current", index === currentSlide ? "step" : "false");
    });

    if (shouldFocus && cards[currentSlide]) {
      cards[currentSlide].focus({ preventScroll: true });
      selectors.deck.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function goToSlide(index, shouldFocus = false) {
    currentSlide = Math.max(0, Math.min(index, slideTotal - 1));
    updateSlide(shouldFocus);
  }

  function render() {
    const responses = data.responses;
    renderStats(responses);
    renderDeck(responses);
  }

  function init() {
    selectors.sourceCount.textContent = String(data.responseCount);
    selectors.sourceName.textContent = data.sourceName;
    selectors.sourceName.title = data.sourceName;
    selectors.sourceDate.textContent = data.generatedOn;

    selectors.previous.addEventListener("click", () => goToSlide(currentSlide - 1, true));
    selectors.next.addEventListener("click", () => goToSlide(currentSlide + 1, true));
    document.addEventListener("keydown", (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToSlide(currentSlide - 1, true);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToSlide(currentSlide + 1, true);
      }
    });

    render();
  }

  init();
})();
