const SUPABASE_URL = "https://xytdygzwdyhmaruiahex.supabase.co";
const SUPABASE_KEY = "sb_publishable_2fRZMcHIdLThGDspuez_YA_0Vz074vq";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const kitMeta = {
  overall: { label: "Overall", icon: "icons/trophy.png" },
  shieldlessuhc: { label: "Shieldless UHC", icon: "icons/shieldlessuhc.png" },
  diamondsmp: { label: "Diamond SMP", icon: "icons/diamondsmp.png" },
  sword: { label: "Sword", icon: "icons/sword.png" },
  mace: { label: "Mace", icon: "icons/mace.png" },
  crystal: { label: "Crystal", icon: "icons/crystal.png" },
  speed: { label: "Speed", icon: "icons/speed.png" },
  creeper: { label: "Creeper", icon: "icons/creeper.png" },
};

let allRows = [];
let currentFilter = null;
let currentSearch = "";

/* ---------- HELPERS ---------- */

function getHead(name, size = 64) {
  return `https://mc-heads.net/avatar/${encodeURIComponent(name)}/${size}`;
}

function getNameMC(name) {
  return `https://namemc.com/profile/${encodeURIComponent(name)}`;
}

function getNameClass(name) {
  const n = (name || "").toLowerCase();
  if (n === "freddywjx" || n === "gothevaxx") return "name-freddywjx";
  if (n === "martinmorty") return "name-martinmorty";
  return "";
}

function getTierColor(tier) {
  if (!tier) return "tier-color-5";
  const n = tier.match(/[1-5]/)?.[0];
  return `tier-color-${n || 5}`;
}

function isHighTier(tier) {
  return typeof tier === "string" && tier.startsWith("HT");
}

function getPrettyKitName(key) {
  return kitMeta[key]?.label || key;
}

function getRankTitle(rank) {
  if (rank === 1) return "Combat Grandmaster";
  if (rank === 2) return "Combat Master";
  if (rank === 3) return "Combat God";
  if (rank <= 10) return "Combat Ace";
  if (rank <= 100) return "Combat Pro";
  return "Ranked Player";
}

function getRankClass(rank) {
  if (rank === 1) return "rank-1";
  if (rank === 2) return "rank-2";
  if (rank === 3) return "rank-3";
  return "rank-default";
}

function escapeHtml(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/* ---------- DATA ---------- */

function aggregate(data) {
  const map = {};

  data.forEach(r => {
    const key = r.ign || r.username || r.id;

    if (!map[key]) {
      map[key] = {
        ign: r.ign || r.username || "Unknown",
        username: r.username || "Unknown",
        points: 0,
        kits: {},
      };
    }

    map[key].points += Number(r.points || 0);

    map[key].kits[r.gamemode] = {
      tier: r.tier || "Unranked",
      points: Number(r.points || 0),
      tier_value: Number(r.tier_value || 0),
    };
  });

  const arr = Object.values(map).sort((a, b) => b.points - a.points);
  arr.forEach((p, i) => {
    p.rank = i + 1;
  });
  return arr;
}

function getPlayerByIgn(ign) {
  return aggregate(allRows).find(p => p.ign === ign) || null;
}

/* ---------- MODAL ---------- */

const modal = document.getElementById("playerModalOverlay");
const modalContent = document.getElementById("playerModalContent");
const modalCloseBtn = document.getElementById("modalCloseBtn");

function openModal(player) {
  if (!player) return;

  const kits = Object.entries(player.kits)
    .sort((a, b) => (b[1].tier_value || 0) - (a[1].tier_value || 0))
    .map(([k, v]) => `
      <div class="modal-kit" data-tooltip="${escapeHtml(`${getPrettyKitName(k)} • ${v.tier} • ${v.points} pts`)}">
        <img src="${kitMeta[k]?.icon || ""}" alt="${escapeHtml(getPrettyKitName(k))}">
        <div class="modal-kit-tier ${getTierColor(v.tier)}">${escapeHtml(v.tier)}</div>
      </div>
    `).join("");

  modalContent.innerHTML = `
    <div class="modal-top">
      <img src="${getHead(player.ign, 128)}" class="modal-head" alt="Player skin">
      <div id="playerModalTitle" class="modal-name ${getNameClass(player.ign)}">${escapeHtml(player.ign)}</div>

      <div class="modal-actions">
        <a href="${getNameMC(player.ign)}" target="_blank" rel="noopener noreferrer" class="namemc-btn">
          NameMC
        </a>
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">POSITION</div>
      <div class="modal-rank-box">
        <div class="modal-rank-number ${getRankClass(player.rank)}">#${player.rank}</div>
        <div class="modal-rank-text">${player.points} points</div>
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">TIERS</div>
      <div class="modal-kits">
        ${kits}
      </div>
    </div>
  `;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

modalCloseBtn.addEventListener("click", closeModal);

modal.addEventListener("click", e => {
  if (e.target === modal) closeModal();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

/* ---------- UI ---------- */

function renderKits() {
  const el = document.getElementById("kits");
  el.innerHTML = "";

  Object.entries(kitMeta).forEach(([k, v]) => {
    const btn = document.createElement("button");
    btn.className = `kit-btn ${((!currentFilter && k === "overall") || currentFilter === k) ? "active" : ""}`;
    btn.title = v.label;
    btn.innerHTML = `<img src="${v.icon}" class="kit-nav-icon" alt="${escapeHtml(v.label)}">`;

    btn.addEventListener("click", () => {
      currentFilter = k === "overall" ? null : k;
      const search = document.getElementById("playerSearch");
      if (currentFilter) {
        currentSearch = "";
        search.value = "";
      }
      render();
    });

    el.appendChild(btn);
  });
}

function setupSearch(players) {
  const input = document.getElementById("playerSearch");
  input.style.display = currentFilter ? "none" : "block";

  if (input.dataset.bound === "1") return;
  input.dataset.bound = "1";

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      currentSearch = e.target.value.trim().toLowerCase();
      render();
    }
  });

  input.addEventListener("input", e => {
    if (!e.target.value.trim()) {
      currentSearch = "";
      render();
    }
  });
}

function renderOverall(players) {
  const board = document.getElementById("leaderboard");
  board.innerHTML = "";

  const shownPlayers = currentSearch
    ? players.filter(p =>
        p.ign.toLowerCase() === currentSearch ||
        p.username.toLowerCase() === currentSearch
      )
    : players;

  if (!shownPlayers.length) {
    board.innerHTML = `<div class="empty">No player found</div>`;
    return;
  }

  shownPlayers.forEach(p => {
    const kits = Object.entries(p.kits)
      .sort((a, b) => (b[1].tier_value || 0) - (a[1].tier_value || 0))
      .map(([k, v]) => `
        <div class="player-kit-box" data-tooltip="${escapeHtml(`${getPrettyKitName(k)} • ${v.tier} • ${v.points} pts`)}">
          <img src="${kitMeta[k]?.icon || ""}" alt="${escapeHtml(getPrettyKitName(k))}">
          <div class="player-kit-tier ${getTierColor(v.tier)}">${escapeHtml(v.tier)}</div>
        </div>
      `).join("");

    const div = document.createElement("div");
    div.className = "player-card";
    div.innerHTML = `
      <div class="rank-block">
        <div class="rank ${getRankClass(p.rank)}">#${p.rank}</div>
        <div class="title">${escapeHtml(getRankTitle(p.rank))}</div>
      </div>

      <div class="player-main-with-head">
        <img src="${getHead(p.ign, 64)}" class="player-head" alt="${escapeHtml(p.ign)}">
        <div class="player-text">
          <div class="ign ${getNameClass(p.ign)}">${escapeHtml(p.ign)}</div>
          <div class="username">@${escapeHtml(p.username)}</div>
        </div>
      </div>

      <div class="points">
        <div class="points-value">${p.points}</div>
        <div class="points-label">Points</div>
      </div>

      <div class="kit-icon-row">${kits}</div>
    `;

    div.addEventListener("click", () => openModal(p));
    board.appendChild(div);
  });
}

function renderTier(rows) {
  const board = document.getElementById("leaderboard");
  board.innerHTML = "";

  const tiers = { 1: [], 2: [], 3: [], 4: [], 5: [] };

  rows.forEach(r => {
    const n = r.tier?.match(/[1-5]/)?.[0];
    if (n) tiers[n].push(r);
  });

  Object.values(tiers).forEach(list => {
    list.sort((a, b) => Number(b.tier_value || 0) - Number(a.tier_value || 0));
  });

  const wrap = document.createElement("div");
  wrap.className = "tier-board";

  for (let i = 1; i <= 5; i++) {
    const col = document.createElement("div");
    col.className = "tier-column";

    col.innerHTML = `
      <div class="tier-header">Tier ${i}</div>
      <div class="tier-list"></div>
    `;

    const list = col.querySelector(".tier-list");

    if (!tiers[i].length) {
      list.innerHTML = `<div class="empty-tier">No players</div>`;
    } else {
      tiers[i].forEach(p => {
        const row = document.createElement("div");
        row.className = `tier-player ${isHighTier(p.tier) ? "high-tier-card" : "low-tier-card"}`;
        row.setAttribute("data-tooltip", `${getPrettyKitName(p.gamemode)} • ${p.tier} • ${p.points} pts`);

        row.innerHTML = `
          <div class="tier-player-left">
            <img src="${getHead(p.ign, 32)}" class="tier-player-icon" alt="${escapeHtml(p.ign)}">
            <span class="tier-player-name ${getNameClass(p.ign)}">${escapeHtml(p.ign)}</span>
          </div>
          <div class="tier-player-right">${isHighTier(p.tier) ? "⟰" : "⟱"}</div>
        `;

        row.addEventListener("click", () => {
          const fullPlayer = getPlayerByIgn(p.ign);
          if (fullPlayer) openModal(fullPlayer);
        });

        list.appendChild(row);
      });
    }

    wrap.appendChild(col);
  }

  board.appendChild(wrap);
}

function render() {
  renderKits();

  const players = aggregate(allRows);
  setupSearch(players);

  const title = document.getElementById("sectionTitle");
  title.textContent = currentFilter ? `${getPrettyKitName(currentFilter)} Tiers` : "Overall Leaderboard";

  if (currentFilter) {
    renderTier(allRows.filter(r => r.gamemode === currentFilter));
  } else {
    renderOverall(players);
  }
}

/* ---------- INIT ---------- */

async function init() {
  try {
    const { data, error } = await supabaseClient.from("Players").select("*");

    if (error) {
      console.error(error);
      document.getElementById("leaderboard").innerHTML = `<div class="empty">Failed to load data</div>`;
      return;
    }

    allRows = data || [];
    render();
  } catch (err) {
    console.error(err);
    document.getElementById("leaderboard").innerHTML = `<div class="empty">Something went wrong</div>`;
  }
}

init();