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
    try {
      await window.waitForRihulaDb();
    } catch (error) {
      console.warn("RIHULA: Achievements database not ready.", error.message);
      return;
    }

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
const dashboardProgress =
    document.getElementById("dashboardAchievementProgress");

const dashboardLatest =
    document.getElementById("dashboardLatestAchievement");

if (dashboardProgress || dashboardLatest) {

    const allAchievements =
        getAchievements(finance.net, rank);

    const unlockedAchievements =
        allAchievements.filter(a => a.unlocked);

    if (dashboardProgress) {
        dashboardProgress.textContent =
            `${unlockedAchievements.length} of ${allAchievements.length} achievements unlocked`;
    }

    if (dashboardLatest) {

        if (unlockedAchievements.length > 0) {

            const latest =
                unlockedAchievements[
                    unlockedAchievements.length - 1
                ];

            dashboardLatest.textContent =
                `${latest.icon} ${latest.title} achieved`;

        } else {

            dashboardLatest.textContent =
                "🌱 Keep saving to unlock your first achievement.";

        }
    }
}
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
      if (container) container.innerHTML 
    }
  }

  // Public API used by finance.js and achievements.html.
  window.getAchievements = getAchievements;
  window.renderAchievements = renderAchievements;
  window.loadMemberAchievements = loadMemberAchievements;

  // finance.js is loaded after this file on some pages, so wait for the finance engine.
  window.addEventListener("load", () => setTimeout(loadMemberAchievements, 100));
})();
/* =========================================================
   DASHBOARD ACHIEVEMENTS
   ========================================================= */

const DASHBOARD_MILESTONES = [
    { amount: 500,   name: "Getting Started", icon: "🌱" },
    { amount: 1000,  name: "First Step",       icon: "🌱" },
    { amount: 1500,  name: "Early Saver",      icon: "⭐" },
    { amount: 2500,  name: "Growing Saver",    icon: "🌿" },
    { amount: 3500,  name: "Steady Saver",     icon: "💚" },
    { amount: 5000,  name: "Consistent Saver", icon: "⭐" },
    { amount: 6500,  name: "Committed Saver",  icon: "💎" },
    { amount: 8000,  name: "Strong Saver",     icon: "🏆" },
    { amount: 10000, name: "Serious Saver",    icon: "🛡️" },
    { amount: 12000, name: "Top Saver",        icon: "🥇" },
    { amount: 13500, name: "Elite Saver",     icon: "👑" },
    { amount: 15000, name: "Master Saver",    icon: "🏆" }
];


const DASHBOARD_RANKS = [
    { min: 1,  max: 1,  name: "Rank #1", icon: "🥇" },
    { min: 2,  max: 2,  name: "Rank #2", icon: "🥈" },
    { min: 3,  max: 3,  name: "Rank #3", icon: "🥉" },
    { min: 4,  max: 5,  name: "Top 5",   icon: "🏅" },
    { min: 6,  max: 10, name: "Top 10",  icon: "🎖️" }
];


function dashboardMoney(amount) {

    return "KSh " +
        Number(amount || 0)
            .toLocaleString("en-KE");

}


function renderDashboardAchievements(
    savings,
    rank
) {

    const savingsContainer =
        document.getElementById(
            "dashboardSavingsAchievements"
        );

    const rankContainer =
        document.getElementById(
            "dashboardRankAchievements"
        );


    if (!savingsContainer) return;


    /*
     * Show selected milestones on the dashboard.
     * The full list remains available through View all.
     */

    const visibleMilestones =
        DASHBOARD_MILESTONES.slice(0, 5);


    savingsContainer.innerHTML = "";


    visibleMilestones.forEach(
        milestone => {

            const achieved =
                savings >= milestone.amount;


            const card =
                document.createElement("div");


            card.className =
                "dashboard-achievement-card " +
                (
                    achieved
                    ? "achieved"
                    : "locked"
                );


            card.innerHTML = `

                <div class="
                    dashboard-achievement-icon
                ">
                    ${milestone.icon}
                </div>

                <div class="
                    dashboard-achievement-name
                ">
                    ${milestone.name}
                </div>

                <div class="
                    dashboard-achievement-amount
                ">
                    ${dashboardMoney(
                        milestone.amount
                    )}
                </div>

                <span class="
                    dashboard-achievement-status
                    ${
                        achieved
                        ? "achieved"
                        : "locked"
                    }
                ">
                    ${
                        achieved
                        ? "✓ Achieved"
                        : "🔒 Locked"
                    }
                </span>

                ${
                    !achieved
                    ? `
                        <div class="
                            milestone-note
                        ">
                            ${dashboardMoney(
                                milestone.amount -
                                savings
                            )}
                            to go
                        </div>
                    `
                    : ""
                }

            `;


            savingsContainer.appendChild(
                card
            );

        }
    );


    if (!rankContainer) return;


    rankContainer.innerHTML = "";


    DASHBOARD_RANKS.forEach(
        achievement => {

            const achieved =
                rank >= achievement.min &&
                rank <= achievement.max;


            const card =
                document.createElement("div");


            card.className =
                "dashboard-achievement-card " +
                (
                    achieved
                    ? "achieved"
                    : "locked"
                );


            card.innerHTML = `

                <div class="
                    dashboard-achievement-icon
                ">
                    ${achievement.icon}
                </div>

                <div class="
                    dashboard-achievement-name
                ">
                    ${achievement.name}
                </div>

                <div class="
                    achievement-summary-small
                ">
                    ${
                        achievement.min ===
                        achievement.max

                        ? "Position " +
                          achievement.min

                        : "Position " +
                          achievement.min +
                          " - " +
                          achievement.max
                    }
                </div>

                <br>

                <span class="
                    dashboard-achievement-status
                    ${
                        achieved
                        ? "achieved"
                        : "locked"
                    }
                ">
                    ${
                        achieved
                        ? "✓ Achieved"
                        : "🔒 Locked"
                    }
                </span>

            `;


            rankContainer.appendChild(
                card
            );

        }
    );

}