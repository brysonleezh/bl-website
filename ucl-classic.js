const app = document.querySelector("#managerApp");

const clubTiers = [
  {
    name: "Tier 1",
    label: "Elite",
    clubs: [
      { name: "Manchester City", short: "MCI", budget: 120, attack: 91, defense: 86, color: "#6cabdd" },
      { name: "Arsenal", short: "ARS", budget: 110, attack: 88, defense: 85, color: "#ef0107" },
      { name: "Liverpool", short: "LIV", budget: 115, attack: 89, defense: 82, color: "#c8102e" },
    ],
  },
  {
    name: "Tier 2",
    label: "Contender",
    clubs: [
      { name: "Chelsea", short: "CHE", budget: 90, attack: 84, defense: 80, color: "#034694" },
      { name: "Manchester United", short: "MUN", budget: 85, attack: 82, defense: 77, color: "#da291c" },
      { name: "Tottenham Hotspur", short: "TOT", budget: 80, attack: 85, defense: 78, color: "#132257" },
      { name: "Newcastle United", short: "NEW", budget: 75, attack: 81, defense: 82, color: "#241f20" },
    ],
  },
  {
    name: "Tier 3",
    label: "Established",
    clubs: [
      { name: "Aston Villa", short: "AVL", budget: 65, attack: 82, defense: 80, color: "#95bfe5" },
      { name: "Brighton & Hove Albion", short: "BHA", budget: 60, attack: 80, defense: 76, color: "#0057b8" },
      { name: "West Ham United", short: "WHU", budget: 55, attack: 78, defense: 77, color: "#7a263a" },
    ],
  },
  {
    name: "Tier 4",
    label: "Mid-Table",
    clubs: [
      { name: "Fulham", short: "FUL", budget: 50, attack: 76, defense: 75, color: "#111111" },
      { name: "Brentford", short: "BRE", budget: 45, attack: 77, defense: 74, color: "#e30613" },
      { name: "AFC Bournemouth", short: "BOU", budget: 45, attack: 75, defense: 73, color: "#b50e12" },
      { name: "Crystal Palace", short: "CRY", budget: 45, attack: 76, defense: 74, color: "#1b458f" },
      { name: "Wolverhampton Wanderers", short: "WOL", budget: 42, attack: 74, defense: 75, color: "#fdb913" },
      { name: "Nottingham Forest", short: "NFO", budget: 48, attack: 75, defense: 74, color: "#dd0000" },
    ],
  },
  {
    name: "Tier 5",
    label: "Survival",
    clubs: [
      { name: "Everton", short: "EVE", budget: 35, attack: 72, defense: 73, color: "#003399" },
      { name: "Leeds United", short: "LEE", budget: 32, attack: 73, defense: 71, color: "#ffcd00" },
      { name: "Sunderland", short: "SUN", budget: 28, attack: 71, defense: 70, color: "#eb172b" },
      { name: "Burnley", short: "BUR", budget: 30, attack: 70, defense: 72, color: "#6c1d45" },
    ],
  },
];

const transferTargets = [
  { name: "Clinical No. 9", role: "ST", fee: 48, attack: 7, defense: 0 },
  { name: "Touchline Winger", role: "RW", fee: 38, attack: 6, defense: 0 },
  { name: "Tempo Setter", role: "CM", fee: 42, attack: 3, defense: 3 },
  { name: "Ball-Winning Six", role: "DM", fee: 34, attack: 0, defense: 5 },
  { name: "Recovery Centre Back", role: "CB", fee: 36, attack: 0, defense: 6 },
  { name: "Commanding Keeper", role: "GK", fee: 30, attack: 0, defense: 5 },
];

const formations = ["4-4-2", "4-3-3", "3-5-2", "4-2-3-1", "5-3-2", "3-4-3"];
const philosophies = ["Attacking", "Possession", "Pragmatic", "Defensive", "Developmental", "Rotation-Heavy"];
const nationalities = ["American", "Argentine", "Brazilian", "Dutch", "English", "French", "German", "Italian", "Japanese", "Portuguese", "South Korean", "Spanish"];

const defaultState = {
  screen: "landing",
  slot: null,
  club: null,
  manager: {
    name: "",
    nationality: "",
    age: 35,
    background: "",
    formation: "",
    philosophy: "",
    bio: "",
    avatar: 0,
  },
  budget: 0,
  squadAttack: 0,
  squadDefense: 0,
  morale: 66,
  signings: [],
  activity: [],
  transferNews: [],
  table: [],
  fixtures: [],
};

let state = structuredClone(defaultState);

function setScreen(screen) {
  state.screen = screen;
  render();
}

function allClubs() {
  return clubTiers.flatMap((tier) => tier.clubs.map((club) => ({ ...club, tier: tier.name, label: tier.label })));
}

function crest(club) {
  return `<span class="club-crest" style="--club-color:${club.color}">${club.short}</span>`;
}

function appShell(content, className = "") {
  app.className = `manager-app ${className}`;
  app.innerHTML = content;
}

function renderLanding() {
  appShell(
    `<section class="cover-screen">
      <div class="game-logo" aria-hidden="true">
        <span>PL</span>
      </div>
      <h1>Premier League</h1>
      <h2>Manager</h2>
      <p>Build your dynasty. Manage your squad. Conquer the league.</p>
      <button class="primary-action" type="button" data-action="play">Play</button>
      <span class="season-chip">Season 2026</span>
    </section>`,
    "is-cover"
  );
}

function renderSlots() {
  appShell(
    `<section class="menu-screen">
      ${brandHeader("Premier League", "Manager", "Select a save slot to continue or start a new game")}
      <div class="slot-grid">
        ${[1, 2, 3]
          .map(
            (slot) => `<button class="slot-card" type="button" data-slot="${slot}">
              <span>Slot ${slot}</span>
              <strong>Empty Slot</strong>
              <small>Start New Game</small>
            </button>`
          )
          .join("")}
      </div>
    </section>`
  );
}

function renderClubSelection() {
  appShell(
    `<section class="club-screen">
      <button class="back-button" type="button" data-action="slots">← Back</button>
      <h1>Choose Your Club</h1>
      <p class="screen-subtitle">Select a Premier League club to manage</p>
      ${clubTiers
        .map(
          (tier) => `<section class="tier-section">
            <h2>${tier.name} — ${tier.label}</h2>
            <div class="club-select-grid">
              ${tier.clubs
                .map(
                  (club) => `<button class="select-club-card" type="button" data-club="${club.short}">
                    ${crest(club)}
                    <span>
                      <strong>${club.name}</strong>
                      <small>Budget: £${club.budget}M</small>
                    </span>
                    <em>${club.short}</em>
                  </button>`
                )
                .join("")}
            </div>
          </section>`
        )
        .join("")}
    </section>`
  );
}

function renderManagerCreator() {
  const club = state.club;
  appShell(
    `<section class="creator-screen">
      <button class="back-button" type="button" data-action="club-select">← Back to Club Selection</button>
      <h1>Create Your Manager</h1>
      <p class="screen-subtitle">Taking charge at ${club.name}</p>

      <form class="manager-form" data-manager-form>
        <div class="avatar-panel">
          <div class="avatar-circle avatar-${state.manager.avatar}" aria-hidden="true">Avatar</div>
          <button class="secondary-action" type="button" data-action="shuffle-avatar">Shuffle</button>
        </div>

        <label>
          <span>Name</span>
          <input name="name" maxlength="40" placeholder="Enter manager name" value="${escapeAttribute(state.manager.name)}" required />
          <small>${state.manager.name.length}/40</small>
        </label>

        ${selectField("nationality", "Nationality", nationalities, state.manager.nationality)}

        <label>
          <span>Age</span>
          <input name="age" type="number" min="25" max="75" value="${state.manager.age}" />
        </label>

        ${selectField("background", "Playing Background", ["Former Professional", "Lower League Pro", "Academy Coach", "Journalist", "Analyst", "Never Played"], state.manager.background)}

        ${selectField("formation", "Preferred Formation ★", formations, state.manager.formation)}
        <p class="form-note">★ +1 ATK, +1 DEF bonus when using this formation</p>

        ${selectField("philosophy", "Philosophy", philosophies, state.manager.philosophy)}

        <label>
          <span>Bio (optional)</span>
          <textarea name="bio" maxlength="500" placeholder="Write a short bio for your manager...">${escapeHtml(state.manager.bio)}</textarea>
          <small>${state.manager.bio.length}/500</small>
        </label>

        <button class="primary-action take-charge" type="submit">Take Charge</button>
      </form>
    </section>`
  );
}

function renderDashboard() {
  const attack = getAttack();
  const defense = getDefense();
  const rating = Math.round((attack + defense + state.morale) / 3);

  appShell(
    `<section class="dashboard-screen">
      <header class="dashboard-header">
        <div>
          <span>Season 2026</span>
          <h1>${state.club.name}</h1>
          <p>${state.manager.name || "The Manager"} · ${state.manager.formation || "No formation selected"}</p>
        </div>
        ${crest(state.club)}
      </header>

      <div class="stat-row">
        ${statCard("Budget", `£${state.budget}M`)}
        ${statCard("Attack", attack)}
        ${statCard("Defence", defense)}
        ${statCard("Morale", `${state.morale}%`)}
        ${statCard("Rating", rating)}
      </div>

      <div class="dashboard-grid">
        <section class="game-panel">
          <div class="panel-heading">
            <h2>Transfer Market</h2>
            <span>${state.signings.length}/4 signed</span>
          </div>
          <button class="transfer-sim-button" type="button" data-action="simulate-transfers">Simulate Transfer Window</button>
          <div class="transfer-grid">
            ${transferTargets.map(renderTransferCard).join("")}
          </div>
          <div class="transfer-news">
            <h3>Transfer Centre</h3>
            <ul>
              ${(state.transferNews.length ? state.transferNews : ["No bids submitted yet. Run the window or make a direct signing."])
                .slice(0, 5)
                .map((item) => `<li>${escapeHtml(item)}</li>`)
                .join("")}
            </ul>
          </div>
        </section>

        <aside class="side-column">
          <section class="game-panel">
            <div class="panel-heading">
              <h2>Club Actions</h2>
            </div>
            <div class="action-list">
              <button type="button" data-club-action="training">Training Camp <span>£8M</span></button>
              <button type="button" data-club-action="scout">Scout Report <span>£5M</span></button>
              <button type="button" data-club-action="team-talk">Team Talk <span>Free</span></button>
            </div>
          </section>

          <section class="game-panel">
            <div class="panel-heading">
              <h2>Activity</h2>
            </div>
            <ul class="activity-list">
              ${(state.activity.length ? state.activity : ["Your save is ready."])
                .slice(0, 5)
                .map((item) => `<li>${escapeHtml(item)}</li>`)
                .join("")}
            </ul>
          </section>
        </aside>
      </div>

      <section class="game-panel season-panel">
        <div class="panel-heading">
          <h2>Campaign</h2>
          <button class="primary-action compact" type="button" data-action="simulate">Simulate Season</button>
        </div>
        <div class="table-and-fixtures">
          ${renderTable()}
          <div class="fixture-list">
            ${(state.fixtures.length ? state.fixtures : ["Simulate the season to generate fixtures."])
              .map((fixture) =>
                typeof fixture === "string"
                  ? `<p class="empty-note">${fixture}</p>`
                  : `<article>
                      <strong>${fixture.week}</strong>
                      <span>${fixture.text}</span>
                      <em class="${fixture.result.toLowerCase()}">${fixture.result}</em>
                    </article>`
              )
              .join("")}
          </div>
        </div>
      </section>
    </section>`
  );
}

function brandHeader(title, subtitle, copy) {
  return `<div class="brand-block">
    <div class="game-logo small" aria-hidden="true"><span>PL</span></div>
    <h1>${title}</h1>
    <h2>${subtitle}</h2>
    <p>${copy}</p>
  </div>`;
}

function selectField(name, label, options, selected) {
  return `<label>
    <span>${label}</span>
    <select name="${name}">
      <option value="">Select ${label.toLowerCase().replace(" ★", "")}</option>
      ${options.map((option) => `<option value="${option}" ${option === selected ? "selected" : ""}>${option}</option>`).join("")}
    </select>
  </label>`;
}

function statCard(label, value) {
  return `<div class="stat-card"><span>${label}</span><strong>${value}</strong></div>`;
}

function renderTransferCard(player) {
  const signed = state.signings.some((item) => item.name === player.name);
  const disabled = (!signed && state.signings.length >= 4) || (!signed && state.budget < player.fee);
  return `<button class="transfer-card ${signed ? "is-signed" : ""}" type="button" data-player="${player.name}" ${disabled ? "disabled" : ""}>
    <strong>${player.name}</strong>
    <span>${player.role}</span>
    <small>£${player.fee}M · ATK +${player.attack} · DEF +${player.defense}</small>
  </button>`;
}

function renderTable() {
  if (!state.table.length) {
    return `<table class="league-table"><tbody><tr><td>Run the season to see the final table.</td></tr></tbody></table>`;
  }

  return `<table class="league-table" aria-label="Premier League table">
    <thead>
      <tr><th>Pos</th><th>Club</th><th>Pts</th><th>GD</th></tr>
    </thead>
    <tbody>
      ${state.table
        .map(
          (row, index) => `<tr class="${row.name === state.club.name ? "is-user-club" : ""}">
            <td>${index + 1}</td>
            <td>${row.name}</td>
            <td>${row.pts}</td>
            <td>${row.gd > 0 ? `+${row.gd}` : row.gd}</td>
          </tr>`
        )
        .join("")}
    </tbody>
  </table>`;
}

function chooseClub(short) {
  state.club = allClubs().find((club) => club.short === short);
  state.budget = state.club.budget;
  state.squadAttack = state.club.attack;
  state.squadDefense = state.club.defense;
  state.activity = [`${state.club.name} selected. Budget: £${state.club.budget}M.`];
  state.transferNews = [];
  setScreen("manager");
}

function updateManagerFromForm(form) {
  const data = new FormData(form);
  state.manager = {
    ...state.manager,
    name: String(data.get("name") || "").trim(),
    nationality: String(data.get("nationality") || ""),
    age: Number(data.get("age") || 35),
    background: String(data.get("background") || ""),
    formation: String(data.get("formation") || ""),
    philosophy: String(data.get("philosophy") || ""),
    bio: String(data.get("bio") || "").trim(),
  };
}

function getAttack() {
  const formationBonus = state.manager.formation ? 1 : 0;
  return state.squadAttack + formationBonus + state.signings.reduce((total, player) => total + player.attack, 0);
}

function getDefense() {
  const formationBonus = state.manager.formation ? 1 : 0;
  return state.squadDefense + formationBonus + state.signings.reduce((total, player) => total + player.defense, 0);
}

function togglePlayer(name) {
  const player = transferTargets.find((item) => item.name === name);
  const index = state.signings.findIndex((item) => item.name === name);

  if (index >= 0) {
    state.signings.splice(index, 1);
    state.budget += player.fee;
    state.activity.unshift(`${player.name} removed from the squad plan.`);
    state.transferNews.unshift(`${player.name} deal cancelled. Budget restored.`);
  } else if (state.signings.length < 4 && state.budget >= player.fee) {
    state.signings.push(player);
    state.budget -= player.fee;
    state.activity.unshift(`${player.name} signed for £${player.fee}M.`);
    state.transferNews.unshift(`${player.name} joins ${state.club.name} after direct talks.`);
  }

  state.table = [];
  state.fixtures = [];
  renderDashboard();
}

function simulateTransferWindow() {
  const openSlots = 4 - state.signings.length;
  if (openSlots <= 0) {
    state.transferNews.unshift("Squad registration is full. No more incoming deals this window.");
    renderDashboard();
    return;
  }

  const available = transferTargets.filter((player) => !state.signings.some((signed) => signed.name === player.name));
  const attempts = available
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(3, available.length, openSlots + 1));

  const rivals = ["Chelsea", "Tottenham", "Newcastle", "West Ham", "Brighton", "Saudi Pro League side"];
  const news = [];

  attempts.forEach((player) => {
    if (state.signings.length >= 4) return;

    const rival = rivals[Math.floor(Math.random() * rivals.length)];
    const bid = clamp(player.fee + Math.floor(Math.random() * 11) - 4, Math.max(8, player.fee - 6), player.fee + 12);
    const pull = state.club.budget > 70 ? 10 : 0;
    const chance = 48 + pull + Math.round((state.morale - 60) / 3) - Math.max(0, bid - player.fee);
    const signed = bid <= state.budget && Math.random() * 100 < chance;

    if (signed) {
      state.signings.push(player);
      state.budget -= bid;
      news.unshift(`${player.name}: bid accepted at £${bid}M. ${rival} could not match the package.`);
      state.activity.unshift(`${player.name} signed through the simulated window.`);
      return;
    }

    if (bid > state.budget) {
      news.unshift(`${player.name}: talks collapsed. Asking price reached £${bid}M, above your remaining budget.`);
      return;
    }

    news.unshift(`${player.name}: ${rival} hijacked the deal after late negotiations.`);
  });

  if (!news.length) news.push("Quiet window. No suitable targets moved.");

  state.transferNews = [...news, ...state.transferNews].slice(0, 8);
  state.table = [];
  state.fixtures = [];
  renderDashboard();
}

function runClubAction(type) {
  if (type === "training" && state.budget >= 8) {
    state.budget -= 8;
    state.squadAttack += 1;
    state.squadDefense += 1;
    state.activity.unshift("Training camp completed. ATK +1, DEF +1.");
  }

  if (type === "scout" && state.budget >= 5) {
    state.budget -= 5;
    state.squadDefense += 1;
    state.morale = clamp(state.morale + 2, 0, 100);
    state.activity.unshift("Scout report improved match preparation.");
  }

  if (type === "team-talk") {
    state.morale = clamp(state.morale + 7, 0, 100);
    state.activity.unshift("Team talk landed well. Morale +7.");
  }

  state.table = [];
  state.fixtures = [];
  renderDashboard();
}

function simulateSeason() {
  const opponents = ["Brighton", "Chelsea", "Liverpool", "Tottenham", "Arsenal", "Manchester City", "Newcastle United"].filter(
    (opponent) => opponent !== state.club.name
  );
  const rating = Math.round((getAttack() + getDefense() + state.morale) / 3);

  state.fixtures = opponents.slice(0, 6).map((opponent, index) => {
    const score = rating + Math.floor(Math.random() * 18) - 8;
    const result = score > 84 ? "Win" : score > 77 ? "Draw" : "Loss";
    return {
      week: `MW ${index * 6 + 1}`,
      text: `${result} against ${opponent}. Performance ${score}.`,
      result,
    };
  });

  const points = state.fixtures.reduce((total, fixture) => total + (fixture.result === "Win" ? 3 : fixture.result === "Draw" ? 1 : 0), 0);
  const projectedPoints = clamp(Math.round(40 + points * 4.5 + (rating - 76) * 1.45), 25, 96);
  const projectedGd = clamp(Math.round((getAttack() - 78) * 1.4 + (getDefense() - 76) * 0.8), -40, 58);

  state.table = buildTable(projectedPoints, projectedGd);
  state.activity.unshift(`Season simulated. ${state.club.name} projected ${projectedPoints} points.`);
  renderDashboard();
}

function buildTable(projectedPoints, projectedGd) {
  const rows = allClubs()
    .filter((club) => club.short !== state.club.short)
    .map((club) => ({
      name: club.name,
      pts: clamp(Math.round(30 + (club.attack + club.defense - 145) * 1.05 + Math.random() * 22), 25, 92),
      gd: clamp(Math.round((club.attack + club.defense - 154) * 0.9 + Math.random() * 20 - 8), -36, 56),
    }));

  rows.push({ name: state.club.name, pts: projectedPoints, gd: projectedGd });

  const sorted = rows.sort((a, b) => b.pts - a.pts || b.gd - a.gd);
  const top = sorted.slice(0, 12);
  const userRow = sorted.find((row) => row.name === state.club.name);

  if (userRow && !top.includes(userRow)) {
    top[top.length - 1] = userRow;
    return top.sort((a, b) => b.pts - a.pts || b.gd - a.gd);
  }

  return top;
}

function shuffleAvatar() {
  state.manager.avatar = (state.manager.avatar + 1 + Math.floor(Math.random() * 5)) % 6;
  renderManagerCreator();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

app.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  const slot = event.target.closest("[data-slot]")?.dataset.slot;
  const club = event.target.closest("[data-club]")?.dataset.club;
  const player = event.target.closest("[data-player]")?.dataset.player;
  const clubAction = event.target.closest("[data-club-action]")?.dataset.clubAction;

  if (action === "play") setScreen("slots");
  if (action === "slots") setScreen("slots");
  if (action === "club-select") setScreen("clubs");
  if (action === "shuffle-avatar") shuffleAvatar();
  if (action === "simulate") simulateSeason();
  if (action === "simulate-transfers") simulateTransferWindow();

  if (slot) {
    state.slot = Number(slot);
    setScreen("clubs");
  }

  if (club) chooseClub(club);
  if (player) togglePlayer(player);
  if (clubAction) runClubAction(clubAction);
});

app.addEventListener("submit", (event) => {
  if (!event.target.matches("[data-manager-form]")) return;
  event.preventDefault();
  updateManagerFromForm(event.target);
  state.activity.unshift(`${state.manager.name || "Your manager"} took charge at ${state.club.name}.`);
  setScreen("dashboard");
});

app.addEventListener("input", (event) => {
  if (!event.target.closest("[data-manager-form]")) return;
  updateManagerFromForm(event.target.form);
});

function render() {
  if (state.screen === "landing") renderLanding();
  if (state.screen === "slots") renderSlots();
  if (state.screen === "clubs") renderClubSelection();
  if (state.screen === "manager") renderManagerCreator();
  if (state.screen === "dashboard") renderDashboard();
}

render();
