
/* ------------------------------------------------------------------
   Championship standings board
   The upstream API shape isn't fully known ahead of time, so this
   file normalizes a handful of common standings JSON shapes
   (Ergast-style, {drivers, constructors}, nested under "data", etc.)
   before rendering. If your API uses different field names, the
   FIELD LOOKUP section below is the only place you should need to edit.
------------------------------------------------------------------- */
 
const TEAM_COLORS = {
  "red bull": "#3671C6", "red bull racing": "#3671C6", "oracle red bull racing": "#3671C6",
  "ferrari": "#E8002D", "scuderia ferrari": "#E8002D",
  "mercedes": "#27F4D2", "mercedes-amg petronas": "#27F4D2",
  "mclaren": "#FF8000", "mclaren f1 team": "#FF8000",
  "aston martin": "#229971", "aston martin aramco": "#229971",
  "alpine": "#FF87BC", "bwt alpine f1 team": "#FF87BC",
  "williams": "#64C4FF", "williams racing": "#64C4FF",
  "rb": "#6692FF", "racing bulls": "#6692FF", "visa cash app rb": "#6692FF", "alphatauri": "#6692FF",
  "kick sauber": "#52E252", "sauber": "#52E252", "stake f1 team": "#52E252",
  "haas": "#B6BABD", "haas f1 team": "#B6BABD", "moneygram haas f1 team": "#B6BABD",
};
const FALLBACK_COLORS = ["#E10600", "#3671C6", "#27F4D2", "#FF8000", "#52E252", "#64C4FF", "#B6BABD", "#FF87BC", "#229971", "#6692FF"];
 
function teamColor(name, idx){
  if (!name) return FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
  const key = String(name).trim().toLowerCase();
  return TEAM_COLORS[key] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}
 
function initials(name){
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
 
function pick(obj, keys){
  for (const k of keys){
    const v = getPath(obj, k);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}
 
function getPath(obj, path){
  return path.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}
 
function asNumber(v, fallback = 0){
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : fallback;
}
 
/* ---------------------- Locate the two lists ---------------------- */
 
function findArray(root, candidates){
  for (const path of candidates){
    const v = getPath(root, path);
    if (Array.isArray(v) && v.length) return v;
  }
  // Ergast-style deep nesting: MRData.StandingsTable.StandingsLists[0].DriverStandings
  const lists = getPath(root, "MRData.StandingsTable.StandingsLists");
  if (Array.isArray(lists) && lists.length){
    const l = lists[0];
    if (Array.isArray(l.DriverStandings)) return l.DriverStandings;
    if (Array.isArray(l.ConstructorStandings)) return l.ConstructorStandings;
  }
  // last resort: scan one level deep for the first array of objects
  for (const key of Object.keys(root || {})){
    const v = root[key];
    if (Array.isArray(v) && v.length && typeof v[0] === "object") return v;
  }
  return [];
}
 
function normalizeDrivers(root){
  const raw = findArray(root, [
    "drivers", "driverStandings", "driver_standings", "DriverStandings",
    "data.drivers", "data.driverStandings", "standings.drivers",
    "championship.drivers", "results.drivers"
  ]);
  return raw.map((d, i) => {
    const driverObj = d.Driver || d.driver || d;
    const constructorObj = (d.Constructors && d.Constructors[0]) || d.Constructor || d.team || d.constructor || {};
    const first = pick(d, ["firstName", "first_name"]) || pick(driverObj, ["givenName", "firstName", "first_name"]);
    const last = pick(d, ["lastName", "last_name"]) || pick(driverObj, ["familyName", "lastName", "last_name"]);
    const fullName = [first, last].filter(Boolean).join(" ") ||
                      pick(d, ["name", "fullName", "driverName", "full_name"]) ||
                      pick(driverObj, ["name", "fullName", "full_name"]) || "Unknown Driver";
    const teamName = pick(d, ["teamName", "team", "constructor", "constructorName"]) ||
                      pick(constructorObj, ["name", "teamName"]) || "";
    const code = pick(d, ["driverId", "code", "driverCode"]) || pick(driverObj, ["code", "driverCode"]);
    const color = pick(d, ["teamColor", "color"]);
    return {
      position: asNumber(pick(d, ["position", "pos", "rank", "standing"]), i + 1),
      name: fullName,
      team: teamName,
      points: asNumber(pick(d, ["points", "pts", "totalPoints"]), 0),
      wins: asNumber(pick(d, ["wins", "totalWins"]), 0),
      podiums: asNumber(pick(d, ["podiums"]), 0),
      code: code ? String(code).toUpperCase() : null,
      color: color || teamColor(teamName, i),
    };
  }).sort((a, b) => a.position - b.position);
}
 
function normalizeConstructors(root){
  const raw = findArray(root, [
    "constructors", "constructorStandings", "constructor_standings", "ConstructorStandings",
    "data.constructors", "data.constructorStandings", "standings.constructors",
    "championship.constructors", "results.constructors"
  ]);
  return raw.map((c, i) => {
    const constructorObj = c.Constructor || c.constructor || c.team || c;
    const teamName = pick(c, ["teamName", "name", "team", "constructorName"]) ||
                      pick(constructorObj, ["name", "teamName"]) || "Unknown Team";
    const color = pick(c, ["teamColor", "color"]);
    return {
      position: asNumber(pick(c, ["position", "pos", "rank", "standing"]), i + 1),
      name: teamName,
      points: asNumber(pick(c, ["points", "pts", "totalPoints"]), 0),
      wins: asNumber(pick(c, ["wins", "totalWins"]), 0),
      podiums: asNumber(pick(c, ["podiums"]), 0),
      logo: pick(c, ["logoFile", "logo"]),
      drivers: Array.isArray(c.drivers) ? c.drivers : null,
      color: color || teamColor(teamName, i),
    };
  }).sort((a, b) => a.position - b.position);
}
 
/* ---------------------------- Rendering ---------------------------- */
 
const boardBody = document.getElementById("board-body");
const legend = document.getElementById("board-legend");
const tabsEl = document.querySelector(".tabs");
const updateNote = document.getElementById("update-note");
 
let state = { drivers: [], constructors: [], active: "drivers" };
 
function posSuffixClass(pos){
  if (pos === 1) return "row--p1";
  if (pos === 2) return "row--p2";
  if (pos === 3) return "row--p3";
  return "";
}
 
function renderRows(list, type){
  if (!list.length){
    boardBody.innerHTML = `
      <div class="state-message">
        <strong>No ${type} standings found</strong>
        The API responded, but this page couldn't find a recognizable ${type} list in it.
      </div>`;
    return;
  }
 
  const maxPoints = Math.max(...list.map(r => r.points), 1);
 
  boardBody.innerHTML = list.map((r, i) => {
    const pct = Math.max((r.points / maxPoints) * 100, 2);
    const imgSrc = type === "drivers" ? (r.code ? `/${r.code}.avif` : null) : (r.logo ? `/${r.logo}` : null);
    const avatar = imgSrc
      ? `<img class="row__avatar" src="${imgSrc}" alt=""
           onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'row__badge',style:'background:${r.color}',textContent:'${initials(r.name)}'}))">`
      : `<div class="row__badge" style="background:${r.color}">${initials(r.name)}</div>`;
 
    const statBits = [];
    if (r.wins) statBits.push(`${r.wins} win${r.wins === 1 ? "" : "s"}`);
    if (r.podiums) statBits.push(`${r.podiums} podium${r.podiums === 1 ? "" : "s"}`);
 
    const subLabel = type === "drivers"
      ? `<div class="row__team">${r.team || ""}${statBits.length ? ` · ${statBits.join(" · ")}` : ""}</div>`
      : `<div class="row__team">${statBits.length ? statBits.join(" · ") : (r.drivers ? r.drivers.join(" / ") : "")}</div>`;
 
    return `
      <div class="row ${posSuffixClass(r.position)}" style="--team-color:${r.color}; --i:${i}">
        <div class="row__pos">${r.position}</div>
        <div class="row__main">
          ${avatar}
          <div class="row__id">
            <div class="row__name">${r.name}</div>
            ${subLabel}
          </div>
        </div>
        <div class="row__pts-wrap">
          <div class="row__pts" data-count="${r.points}">0</div>
          <div class="row__bar-track"><div class="row__bar-fill" data-pct="${pct}"></div></div>
        </div>
      </div>`;
  }).join("");
 
  legend.querySelector(".board-legend__name").textContent = type === "drivers" ? "Driver" : "Constructor";
 
  requestAnimationFrame(() => {
    boardBody.querySelectorAll(".row__bar-fill").forEach(el => {
      el.style.width = el.dataset.pct + "%";
    });
    boardBody.querySelectorAll(".row__pts").forEach(el => animateCount(el, asNumber(el.dataset.count)));
  });
}
 
function animateCount(el, target){
  const duration = 700;
  const start = performance.now();
  function frame(now){
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(eased * target);
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
 
function showTab(tab){
  state.active = tab;
  tabsEl.classList.toggle("constructors-active", tab === "constructors");
  document.querySelectorAll(".tab").forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });
  renderRows(state[tab], tab);
}
 
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => showTab(btn.dataset.tab));
});
 
/* ------------------------------ Fetch ------------------------------ */
 
fetch("/api/championship")
  .then(res => {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.json();
  })
  .then(data => {
    state.drivers = normalizeDrivers(data);
    state.constructors = normalizeConstructors(data);
    const season = pick(data, ["season", "year"]) || pick(data, ["data.season"]);
    if (season){
      document.getElementById("season-label").textContent = `${season} CHAMPIONSHIP`;
    }
    updateNote.textContent = season ? `Season ${season} · live from formula-telemetry.com` : "Live from formula-telemetry.com";
    showTab("drivers");
  })
  .catch(err => {
    console.error("Championship fetch failed:", err);
    boardBody.innerHTML = `
      <div class="state-message">
        <strong>Couldn't load standings</strong>
        ${err.message || "The championship API didn't respond as expected."} Check the Flask
        console for details, or confirm formula-telemetry.com is reachable.
      </div>`;
    updateNote.textContent = "—";
  });
 