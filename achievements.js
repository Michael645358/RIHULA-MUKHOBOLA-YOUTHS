/* RIHULA ACHIEVEMENTS - SINGLE SOURCE OF TRUTH
 * Uses the existing finance engine (net savings = contributions - withdrawals).
 * Does not depend on optional achievement database tables.
 */
(function () {
  "use strict";

  const MILESTONES = [
    { amount: 1000, icon: "🌱", title: "First KSh 1,000", text: "You have saved at least KSh 1,000 in net savings." },
    { amount: 5000, icon: "⭐", title: "KSh 5,000 Saver", text: "You reached KSh 5,000 in net savings." },
    { amount: 10000, icon: "💎", title: "KSh 10,000 Champion", text: "You reached KSh 10,000 in net savings." },
    { amount: 25000, icon: "🏅", title: "KSh 25,000 Builder", text: "You reached KSh 25,000 in net savings." }
  ];

  function money(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function fmt(value) {
    return "KSh " + money(value).toLocaleString("en-KE", { maximumFractionDigits: 2 });
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  function getAchievements(net, rank) {
    const n = money(net);
    const r = Math.max(0, Math.floor(money(rank)));
    const list = MILESTONES.map(a => ({
      ...a,
      unlocked: n >= a.amount
    }));

    if (r === 1) list.push({ icon: "🥇", title: "#1 Leader", text: "You are currently the top net saver.", unlocked: true, rank: true });
    else if (r === 2) list.push({ icon: "🥈", title: "#2 Leader", text: "You are currently second on the leaderboard.", unlocked: true, rank: true });
    else if (r === 3) list.push({ icon: "🥉", title: "#3 Leader", text: "You are currently third on the leaderboard.", unlocked: true, rank: true });

    return list;
  }

  function nextMilestone(net) {
    const n = money(net);
    return MILESTONES.find(a => n < a.amount) || null;
  }

  function renderAchievements(net, rank, containerId, includeLocked = false) {
    const container = document.getElementById(containerId || "achievementsContainer");
    if (!container) return;

    const achievements = getAchievements(net, rank);
    const visible = includeLocked ? achievements : achievements.filter(a => a.unlocked);
    const unlocked = achievements.filter(a => a.unlocked);

    container.innerHTML = visible.map(a => `
      <article class="achievement-item ${a.unlocked ? "unlocked" : "locked"}">
        <div class="achievement-icon">${a.unlocked ? a.icon : "🔒"}</div>
        <div class="achievement-copy">
          <strong>${esc(a.title)}</strong>
          <p>${esc(a.text)}</p>
        </div>
        <span class="achievement-status">${a.unlocked ? "Unlocked" : "Locked"}</span>
      </article>
    `).join("");

    if (!visible.length) {
      container.innerHTML = '<div class="achievement-empty">Keep saving to unlock your first achievement. 🚀</div>';
    }

    return unlocked;
  }

  async function loadMemberAchievements() {
    const user = (() => {
      try { return JSON.parse(localStorage.getItem("loggedUser") || "null"); }
      catch (_) { return null; }
    })();

    if (!user || !user.phone || !window.rihulaFinance?.netFor) return;

    try {
      const finance = await window.rihulaFinance.netFor(user.phone);
      let rank = 0;

      try {
        const { data, error } = await db.rpc("get_member_rank", { p_phone: String(user.phone) });
        if (!error) rank = money(data);
      } catch (_) {}

      const showLocked = document.body?.classList.contains("achievements-page");
      const unlocked = renderAchievements(finance.net, rank, "achievementsContainer", showLocked) || [];
      const next = nextMilestone(finance.net);
      const percent = next
        ? Math.max(0, Math.min(100, (finance.net / next.amount) * 100))
        : 100;

      const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      };

      set("achievementPoints", unlocked.length.toLocaleString());
      set("achievementSavings", fmt(finance.net));
      set("achievementLevel", unlocked.length ? unlocked[unlocked.length - 1].title : "Starter");
      set("nextReward", next ? fmt(next.amount) : "Highest tier reached");

      const bar = document.getElementById("achievementProgressBar");
      if (bar) bar.style.width = percent + "%";

      const progress = document.getElementById("achievementProgressText");
      if (progress) {
        progress.textContent = next
          ? `${fmt(Math.max(0, next.amount - finance.net))} remaining to ${next.title}.`
          : "Congratulations! You reached the highest savings achievement tier. 🎉";
      }

      // Keep the dedicated Achievements page summary in sync.
      set("achievementNet", fmt(finance.net));
      set("achievementRank", rank > 0 ? "#" + rank : "—");
    } catch (error) {
      console.error("RIHULA achievements failed:", error);
      const container = document.getElementById("achievementsContainer");
      if (container) container.innerHTML = '<div class="achievement-empty">Unable to load achievements. Please try again.</div>';
    }
  }

  // Public API used by finance.js and achievements.html.
  window.getAchievements = getAchievements;
  window.renderAchievements = renderAchievements;
  window.loadMemberAchievements = loadMemberAchievements;

  // finance.js is loaded after this file on some pages, so wait for the finance engine.
  window.addEventListener("load", () => setTimeout(loadMemberAchievements, 100));
})();
