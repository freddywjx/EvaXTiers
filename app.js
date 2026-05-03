const DISCORD_INVITE = "https://discord.gg/srKJbJNxA5";

const SUPABASE_URL = "https://xytdygzwdyhmaruiahex.supabase.co";
const SUPABASE_KEY = "sb_publishable_2fRZMcHIdLThGDspuez_YA_0Vz074vq";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const kits = [
  { id: "overall", name: "Overall", icon: "icons/trophy.png" },
  { id: "mace", name: "Mace", icon: "icons/mace.png" },
  { id: "crystal", name: "Crystal", icon: "icons/crystal.png" },
  { id: "sword", name: "Sword", icon: "icons/sword.png" },
  { id: "speed", name: "Speed", icon: "icons/speed.png" },
  { id: "creeper", name: "Creeper", icon: "icons/creeper.png" },
  { id: "shieldlessuhc", name: "Shieldless UHC", icon: "icons/shieldlessuhc.png" },
  { id: "diamondsmp", name: "Diamond SMP", icon: "icons/diamondsmp.png" },
  { id: "cart", name: "HT Cart", icon: "icons/cart.png" },
];

const kitOrder = [
  "mace",
  "crystal",
  "creeper",
  "speed",
  "cart",
  "shieldlessuhc",
  "sword",
  "diamondsmp",
];

const tierPoints = {
  HT1: 60,
  LT1: 45,
  HT2: 30,
  LT2: 20,
  HT3: 10,
  LT3: 5,
  HT4: 4,
  LT4: 3,
  HT5: 2,
  LT5: 1,
};

const tierOrder = [
  "HT1",
  "LT1",
  "HT2",
  "LT2",
  "HT3",
  "LT3",
  "HT4",
  "LT4",
  "HT5",
  "LT5",
];

const tierGroups = [
  { label: "Tier 1", tiers: ["HT1", "LT1"], className: "t1" },
  { label: "Tier 2", tiers: ["HT2", "LT2"], className: "t2" },
  { label: "Tier 3", tiers: ["HT3", "LT3"], className: "t3" },
  { label: "Tier 4", tiers: ["HT4", "LT4"], className: "t4" },
  { label: "Tier 5", tiers: ["HT5", "LT5"], className: "t5" },
];

let activeKit = "overall";
let players = [];

function normalizeGamemode(value) {
  if (!value) return null;

  const clean = String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");

  const map = {
    mace: "mace",
    crystal: "crystal",
    sword: "sword",
    speed: "speed",
    creeper: "creeper",
    shieldlessuhc: "shieldlessuhc",
    uhc: "shieldlessuhc",
    diamondsmp: "diamondsmp",
    diamond: "diamondsmp",
    smp: "diamondsmp",
    cart: "cart",
    htcart: "cart",
    cartht: "cart",
  };

  return map[clean] || null;
}

function blankTiers() {
  return {
    mace: null,
    crystal: null,
    sword: null,
    speed: null,
    creeper: null,
    shieldlessuhc: null,
    diamondsmp: null,
    cart: null,
  };
}

async function loadPlayers() {
  const app = document.getElementById("app");

  if (!window.supabase) {
    app.innerHTML = `<div class="error">Supabase script did not load.</div>`;
    return;
  }

  const { data, error } = await db
    .from("Players")
    .select("id, username, ign, tier, tier_value, gamemode, points");

  if (error) {
    console.error(error);
    app.innerHTML = `<div class="error">Supabase failed: ${error.message}</div>`;
    return;
  }

  const grouped = {};

  for (const row of data || []) {
    const gm = normalizeGamemode(row.gamemode);
    const tier = String(row.tier || "").toUpperCase();
    const ign = row.ign || row.username;

    if (!gm || !ign || !tierPoints[tier]) continue;

    const key = String(ign).toLowerCase();

    if (!grouped[key]) {
      grouped[key] = {
        ign,
        discord: row.username || ign,
        tiers: blankTiers(),
      };
    }

    grouped[key].tiers[gm] = tier;
  }

  players = Object.values(grouped);
  render();
}

function head(ign) {
  return `https://mc-heads.net/avatar/${encodeURIComponent(ign)}`;
}

function body(ign) {
  return `https://mc-heads.net/body/${encodeURIComponent(ign)}/right`;
}

function namemc(ign) {
  return `https://namemc.com/profile/${encodeURIComponent(ign)}`;
}

function points(player) {
  return Object.values(player.tiers).reduce((sum, tier) => {
    return sum + (tierPoints[tier] || 0);
  }, 0);
}

function sortedPlayers() {
  return [...players].sort((a, b) => {
    return points(b) - points(a) || a.ign.localeCompare(b.ign);
  });
}

function tierClass(tier) {
  if (!tier) return "";
  if (tier.endsWith("1")) return "t1";
  if (tier.endsWith("2")) return "t2";
  if (tier.endsWith("3")) return "t3";
  if (tier.endsWith("4")) return "t4";
  if (tier.endsWith("5")) return "t5";
  return "";
}

function tierLevelClass(tier) {
  if (!tier) return "";
  return tier.startsWith("HT") ? "high-tier" : "low-tier";
}

function nameClass(ign) {
  const n = String(ign).toLowerCase();

  if (n === "freddywjx" || n === "gothevaxx") return "name-gradient";
  if (n === "limoxan") return "name-pink";
  if (n === "xpyw") return "name-green";
  if (n === "martinmorty") return "name-green-glow";

  return "";
}

function kitTooltip(kit, tier) {
  if (!tier) return `${kit.name}: Unranked (0 points)`;
  return `${kit.name}: ${tier} (${tierPoints[tier]} points)`;
}

function sortedKitIdsForPlayer(player) {
  const ranked = kitOrder
    .filter(id => player.tiers[id])
    .sort((a, b) => {
      const tierA = tierOrder.indexOf(player.tiers[a]);
      const tierB = tierOrder.indexOf(player.tiers[b]);
      return tierA - tierB;
    });

  const unranked = kitOrder.filter(id => !player.tiers[id]);

  return [...ranked, ...unranked];
}

function miniTiers(player) {
  return sortedKitIdsForPlayer(player).map(id => {
    const kit = kits.find(k => k.id === id);
    const tier = player.tiers[id];

    return `
      <div class="mini-tier" title="${kitTooltip(kit, tier)}">
        <img class="${tier ? "" : "unranked-icon"}" src="${kit.icon}" alt="${kit.name}">
        ${tier ? `<span class="badge ${tierClass(tier)}">${tier}</span>` : `<span class="badge">—</span>`}
      </div>
    `;
  }).join("");
}

function safeIgn(ign) {
  return String(ign).replaceAll("'", "\\'");
}

function renderShell(content) {
  document.getElementById("app").innerHTML = `
    <section class="top">
      <div class="top-links">
        <a class="discord-btn" href="${DISCORD_INVITE}" target="_blank">Discord</a>
        <a class="test-link" href="${DISCORD_INVITE}" target="_blank">← Tier test here!</a>
      </div>

      <h1 class="title">EvaXTiers</h1>
      <p class="subtitle">Minecraft PvP Tierlist</p>

      <div class="tabs">
        ${kits.map(kit => `
          <button class="tab ${activeKit === kit.id ? "active" : ""}" onclick="setKit('${kit.id}')" title="${kit.name}">
            <img src="${kit.icon}" alt="${kit.name}">
          </button>
        `).join("")}
      </div>
    </section>

    ${content}

    <div id="modal" class="modal" onclick="modalClick(event)">
      <div class="modal-box">
        <button class="close" onclick="closeModal()">×</button>
        <div id="modalContent"></div>
      </div>
    </div>
  `;

  const search = document.getElementById("search");
  if (search) {
    search.addEventListener("keydown", event => {
      if (event.key !== "Enter") return;

      const q = search.value.trim().toLowerCase();
      if (!q) return;

      const found = players.find(player =>
        player.ign.toLowerCase() === q ||
        String(player.discord).toLowerCase() === q
      );

      if (found) openModal(found.ign);
      else alert("Player not found.");
    });
  }
}

function renderOverall() {
  const ranked = sortedPlayers();

  renderShell(`
    <div class="leader-head">
      <h2>Overall Leaderboard</h2>
      <input id="search" class="search" placeholder="Search IGN... press Enter">
    </div>

    <section class="rows">
      ${ranked.map((player, index) => `
        <div class="row" onclick="openModal('${safeIgn(player.ign)}')">
          <div class="rank ${index === 0 ? "top1" : index === 1 ? "top2" : index === 2 ? "top3" : ""}">
            #${index + 1}
          </div>

          <img class="head" src="${head(player.ign)}" alt="${player.ign}">

          <div>
            <div class="name ${nameClass(player.ign)}">${player.ign}</div>
            <div class="discord">@${player.discord}</div>
          </div>

          <div class="points">${points(player)}<span>points</span></div>

          <div class="row-icons">
            ${miniTiers(player)}
          </div>
        </div>
      `).join("")}
    </section>
  `);
}

function renderKit(kitId) {
  const kit = kits.find(k => k.id === kitId);

  const columns = tierGroups.map(group => {
    const list = [...players]
      .filter(player => group.tiers.includes(player.tiers[kitId]))
      .sort((a, b) => {
        const tierA = tierOrder.indexOf(a.tiers[kitId]);
        const tierB = tierOrder.indexOf(b.tiers[kitId]);
        return tierA - tierB || points(b) - points(a) || a.ign.localeCompare(b.ign);
      });

    return `
      <div class="tier-col">
        <h3 class="${group.className}">${group.label}</h3>
        ${
          list.length
            ? list.map(player => {
              const tier = player.tiers[kitId];

              return `
                <div class="tier-player ${tierLevelClass(tier)}" onclick="openModal('${safeIgn(player.ign)}')" title="${kitTooltip(kit, tier)}">
                  <img src="${head(player.ign)}" alt="${player.ign}">
                  <span class="${nameClass(player.ign)}">${player.ign}</span>
                  <span class="badge ${tierClass(tier)}">${tier}</span>
                </div>
              `;
            }).join("")
            : `<div class="empty">—</div>`
        }
      </div>
    `;
  }).join("");

  renderShell(`
    <h2 class="kit-title">
      <img src="${kit.icon}" width="34" style="vertical-align:middle;margin-right:10px;">
      ${kit.name}
    </h2>

    <section class="tier-board">
      ${columns}
    </section>
  `);
}

function setKit(kitId) {
  activeKit = kitId;
  render();
}

function render() {
  if (!players.length) {
    renderShell(`<div class="error">No valid player rows found in Supabase.</div>`);
    return;
  }

  if (activeKit === "overall") renderOverall();
  else renderKit(activeKit);
}

function overallRank(player) {
  return sortedPlayers().findIndex(p => p.ign.toLowerCase() === player.ign.toLowerCase()) + 1;
}

function openModal(ign) {
  const player = players.find(p => p.ign.toLowerCase() === String(ign).toLowerCase());
  if (!player) return;

  document.getElementById("modalContent").innerHTML = `
    <img class="modal-body" src="${body(player.ign)}" alt="${player.ign}">
    <div class="modal-name ${nameClass(player.ign)}">${player.ign}</div>

    <a class="namemc" href="${namemc(player.ign)}" target="_blank">
      View on NameMC
    </a>

    <div class="modal-rank">
      #${overallRank(player)} Overall · ${points(player)} points
    </div>

    <div class="modal-kits">
      ${sortedKitIdsForPlayer(player).map(id => {
        const kit = kits.find(k => k.id === id);
        const tier = player.tiers[id];

        return `
          <div class="modal-kit" title="${kitTooltip(kit, tier)}">
            <img class="${tier ? "" : "unranked-icon"}" src="${kit.icon}" alt="${kit.name}">
            <span class="${tierClass(tier)}">${tier || "—"}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;

  document.getElementById("modal").classList.add("active");
}

function closeModal() {
  document.getElementById("modal").classList.remove("active");
}

function modalClick(event) {
  if (event.target.id === "modal") closeModal();
}

loadPlayers();