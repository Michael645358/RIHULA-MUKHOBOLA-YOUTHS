/* RIHULA Finance Engine
 * Single source of truth:
 * Net Savings = Contributions - Withdrawals
 *
 * Group totals/ranks use secure Supabase functions so members do not
 * need direct SELECT access to every member's financial rows.
 */
(function () {
  "use strict";

  const money = v => Number.isFinite(Number(v)) ? Number(v) : 0;
  const fmt = v => "KSh " + money(v).toLocaleString("en-KE", { maximumFractionDigits: 2 });

  function currentUser() {
    try {
      return JSON.parse(localStorage.getItem("loggedUser") || "null") || null;
    } catch (_) {
      return null;
    }
  }

  async function netFor(phone) {
    const requestedPhone = String(phone || "").trim();
    if (!requestedPhone) throw new Error("Member phone number is required.");

    const { data, error } = await db.rpc("get_member_finance", {
      p_phone: requestedPhone
    });
    if (error) throw error;

    const row = Array.isArray(data) ? (data[0] || {}) : (data || {});
    return {
      contributions: money(row.contributions),
      withdrawals: money(row.withdrawals),
      net: money(row.net_savings)
    };
  }

  async function groupNet() {
    const { data, error } = await db.rpc("get_group_finance");
    if (error) throw error;

    const row = Array.isArray(data) ? (data[0] || {}) : (data || {});
    return {
      contributions: money(row.contributions),
      withdrawals: money(row.withdrawals),
      net: money(row.net_savings)
    };
  }

  window.rihulaFinance = { money, fmt, netFor, groupNet };

  // Member dashboard: member net savings and group net savings.
  window.loadSavingsStats = async function (phone) {
    try {
      const result = await netFor(phone);
      const user = currentUser() || {};
      const goal = Number(user.goal || 5000);
      const percent = goal > 0 ? Math.min(100, Math.round(result.net / goal * 100)) : 0;

      const savings = document.getElementById("mySavings");
      if (savings) savings.textContent = fmt(result.net);

      const goalAmount = document.getElementById("goalAmount");
      if (goalAmount) goalAmount.textContent = `${fmt(result.net)} / ${fmt(goal)}`;

      const progressText = document.getElementById("progressText");
      if (progressText) progressText.textContent = percent + "%";

      const fill = document.getElementById("progressFill");
      if (fill) fill.style.width = percent + "%";

      const group = await groupNet();
      const groupSavings = document.getElementById("groupSavings");
      if (groupSavings) groupSavings.textContent = fmt(group.net);
    } catch (e) {
      console.error("RIHULA finance: member savings failed", e);
    }
  };

  // Member rank uses NET savings, including withdrawals.
  window.loadMyRank = async function () {
    const user = currentUser();
    const el = document.getElementById("myRank");
    if (!user || !el) return;

    try {
      const { data, error } = await db.rpc("get_member_rank", {
        p_phone: String(user.phone || "")
      });
      if (error) throw error;
      const rank = money(data);
      el.textContent = rank > 0 ? "#" + rank : "Unranked";
      try {
        const finance = await netFor(user.phone);
        window.renderAchievements?.(finance.net, rank);
      } catch (_) {}
    } catch (e) {
      console.error("RIHULA finance: member rank failed", e);
      el.textContent = "Unranked";
    }
  };

  // Group goal uses NET savings, so withdrawals reduce progress immediately.
  window.loadGroupGoal = async function () {
    try {
      const { data: settings, error: settingsError } = await db
        .from("settings").select("group_goal").eq("id", 1).single();
      if (settingsError) throw settingsError;

      const goal = money(settings.group_goal);
      const group = await groupNet();
      const collected = group.net;
      const remaining = Math.max(goal - collected, 0);
      const percent = goal > 0 ? Math.round(collected / goal * 100) : 0;
      const width = Math.min(percent, 100);

      const values = {
        groupGoal: fmt(goal),
        groupCollected: fmt(collected),
        groupRemaining: fmt(remaining),
        groupPercent: percent + "% Complete",
        groupGoalAmount: fmt(goal),
        groupGoalCollected: fmt(collected),
        groupGoalRemaining: fmt(remaining),
        groupGoalPercent: percent + "%",
        groupGoalComplete: percent + "% Complete"
      };

      Object.keys(values).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = values[id];
      });

      ["groupProgress", "groupGoalProgress"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.width = width + "%";
      });
    } catch (e) {
      console.error("RIHULA finance: group goal failed", e);
    }
  };

  // Admin dashboard total savings uses NET savings.
  window.loadDashboardStats = async function () {
    try {
      const { count, error: countError } = await db
        .from("members").select("*", { count: "exact", head: true });
      if (!countError) {
        const el = document.getElementById("totalMembers");
        if (el) el.textContent = count || 0;
      }

      const { count: pending, error: pendingError } = await db
        .from("members").select("*", { count: "exact", head: true }).eq("status", "pending");
      if (!pendingError) {
        const el = document.getElementById("pendingMembers");
        if (el) el.textContent = pending || 0;
      }

      const group = await groupNet();
      const el = document.getElementById("totalSavings");
      if (el) el.textContent = fmt(group.net);
    } catch (e) {
      console.error("RIHULA finance: admin stats failed", e);
    }
  };

  window.loadGroupSavings = async function () {
    try {
      const group = await groupNet();
      ["adminGroupSavings", "totalSavings", "groupSavings"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = fmt(group.net);
      });
    } catch (e) {
      console.error("RIHULA finance: group savings failed", e);
    }
  };

  // Leaderboard uses net savings after withdrawals.
  window.loadLeaderboard = async function () {
    const container = document.getElementById("leaderboardContainer");
    if (!container) return;

    try {
      const { data, error } = await db.rpc("get_finance_leaderboard");
      if (error) throw error;

      const rankings = (data || []).map(row => ({
        name: row.member_name || "Member",
        total: money(row.net_savings),
        rank: Number(row.member_rank || 0)
      }));

      container.innerHTML = rankings.length ? rankings.map(m => {
        const medal = m.rank === 1 ? "🥇" : m.rank === 2 ? "🥈" : m.rank === 3 ? "🥉" : "#" + m.rank;
        return `<div class="leaderboard-card">
          <h3>${medal} ${escapeHtml(m.name)}</h3>
          <p>${fmt(m.total)}</p>
        </div>`;
      }).join("") : "<p>No members found.</p>";
    } catch (e) {
      console.error("RIHULA finance: leaderboard failed", e);
      container.innerHTML = "<p>Unable to load leaderboard.</p>";
    }
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[c]));
  }

  window.getAchievements = function (net, rank) {
    const n = money(net);
    const r = Number(rank || 0);
    const list = [];
    if (n >= 1000) list.push({icon:"🌱", title:"First KSh 1,000", text:"You have saved at least KSh 1,000."});
    if (n >= 5000) list.push({icon:"⭐", title:"KSh 5,000 Saver", text:"You reached KSh 5,000 in net savings."});
    if (n >= 10000) list.push({icon:"💎", title:"KSh 10,000 Champion", text:"You reached KSh 10,000 in net savings."});
    if (n >= 25000) list.push({icon:"🏅", title:"KSh 25,000 Builder", text:"You reached KSh 25,000 in net savings."});
    if (r === 1) list.push({icon:"🥇", title:"#1 Leader", text:"You are currently the top net saver."});
    else if (r === 2) list.push({icon:"🥈", title:"#2 Leader", text:"You are currently second on the leaderboard."});
    else if (r === 3) list.push({icon:"🥉", title:"#3 Leader", text:"You are currently third on the leaderboard."});
    return list;
  };

  window.renderAchievements = function (net, rank, containerId) {
    const el = document.getElementById(containerId || "achievementsContainer");
    if (!el) return;
    const list = window.getAchievements(net, rank);
    el.innerHTML = list.length ? list.map(a => `<div class="achievement-item"><span class="achievement-icon">${a.icon}</span><div><strong>${escapeHtml(a.title)}</strong><p>${escapeHtml(a.text)}</p></div></div>`).join("") : `<div class="achievement-empty">Keep saving to unlock your first achievement. 🚀</div>`;
  };

  // Refresh all finance-related UI after a withdrawal/contribution.
  window.refreshRihulaFinance = async function () {
    const user = currentUser();
    await Promise.allSettled([
      window.loadDashboardStats?.(),
      window.loadGroupSavings?.(),
      window.loadLeaderboard?.(),
      user ? window.loadSavingsStats?.(user.phone) : Promise.resolve(),
      user ? window.loadMyRank?.() : Promise.resolve(),
      window.loadGroupGoal?.()
    ]);
  };

  window.addEventListener("load", () => {
    setTimeout(() => window.refreshRihulaFinance(), 50);
  });
})();
