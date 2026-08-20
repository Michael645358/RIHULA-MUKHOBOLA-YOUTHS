// RIHULA Admin Achievements - isolated from the main dashboard
const ADMIN_ACHIEVEMENT_MILESTONES = [
    { amount: 1000, icon: "🌱", title: "KSh 1,000 Starter" },
    { amount: 5000, icon: "⭐", title: "KSh 5,000 Saver" },
    { amount: 10000, icon: "🏆", title: "KSh 10,000 Champion" },
    { amount: 25000, icon: "🏅", title: "KSh 25,000 Builder" }
];

function adminAchievementList(net, rank) {
    const amount = Number(net || 0);
    const r = Number(rank || 0);
    const list = ADMIN_ACHIEVEMENT_MILESTONES.map(item => ({
        ...item,
        unlocked: amount >= item.amount,
        progress: Math.min(100, Math.max(0, amount / item.amount * 100))
    }));
    if (r === 1) list.push({ icon: "🥇", title: "#1 Leader", amount: null, unlocked: true, rank: true, progress: 100 });
    else if (r === 2) list.push({ icon: "🥈", title: "#2 Leader", amount: null, unlocked: true, rank: true, progress: 100 });
    else if (r === 3) list.push({ icon: "🥉", title: "#3 Leader", amount: null, unlocked: true, rank: true, progress: 100 });
    return list;
}

function adminAchievementEscapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[char]));
}

async function loadAdminAchievementsPage() {
    const container = document.getElementById("adminAchievementsContainer");
    if (!container) return;

    try {
        const { data, error } = await db.rpc("get_finance_leaderboard");
        if (error) throw error;

        const rows = (data || []).map(row => ({
            name: row.member_name || "Member",
            net: Number(row.net_savings || 0),
            rank: Number(row.member_rank || 0)
        })).sort((a, b) => a.rank - b.rank);

        let unlockedTotal = 0;
        let membersWithAchievements = 0;

        container.innerHTML = rows.length ? rows.map(member => {
            const achievements = adminAchievementList(member.net, member.rank);
            const unlocked = achievements.filter(a => a.unlocked);
            const next = ADMIN_ACHIEVEMENT_MILESTONES.find(a => member.net < a.amount);
            const progress = next ? Math.min(100, Math.max(0, member.net / next.amount * 100)) : 100;
            unlockedTotal += unlocked.length;
            if (unlocked.length) membersWithAchievements++;

            const latest = unlocked.length ? unlocked[unlocked.length - 1].title : "Starter";
            const nextText = next
                ? `KSh ${Math.max(0, next.amount - member.net).toLocaleString("en-KE")} to ${next.title}`
                : "Highest savings tier reached";

            return `
                <article class="admin-achievement-member">
                    <div class="admin-achievement-member-top">
                        <div class="admin-achievement-member-name">
                            <span class="admin-achievement-avatar">${member.rank === 1 ? "🥇" : member.rank === 2 ? "🥈" : member.rank === 3 ? "🥉" : "🏅"}</span>
                            <div>
                                <strong>${adminAchievementEscapeHtml(member.name)}</strong>
                                <small>${member.rank > 0 ? `Rank #${member.rank}` : "Unranked"} · ${unlocked.length} unlocked</small>
                            </div>
                        </div>
                        <strong class="admin-achievement-net">KSh ${member.net.toLocaleString("en-KE")}</strong>
                    </div>
                    <div class="admin-achievement-progress-row"><span>${adminAchievementEscapeHtml(latest)}</span><span>${Math.round(progress)}%</span></div>
                    <div class="admin-achievement-progress"><span style="width:${progress}%"></span></div>
                    <p class="admin-achievement-next">${adminAchievementEscapeHtml(nextText)}</p>
                    <div class="admin-achievement-badges">
                        ${achievements.map(a => `<span class="admin-achievement-badge ${a.unlocked ? "is-unlocked" : "is-locked"}" title="${adminAchievementEscapeHtml(a.title)}">${a.unlocked ? a.icon : "🔒"} ${adminAchievementEscapeHtml(a.title)}</span>`).join("")}
                    </div>
                </article>`;
        }).join("") : `
            <div class="admin-empty-state"><span>🏆</span><p>No member achievement data is available yet.</p></div>`;

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };
        setText("adminUnlockedAchievements", unlockedTotal);
        setText("adminAchievementMembers", membersWithAchievements);
        setText("adminTopAchiever", rows[0]?.name || "—");
    } catch (error) {
        console.error("RIHULA admin achievements failed:", error);
        container.innerHTML = `
            <div class="admin-empty-state admin-achievement-error"><span>⚠️</span><p>Unable to load achievements. Check the finance RPC and refresh.</p></div>`;
    }
}

document.addEventListener("DOMContentLoaded", loadAdminAchievementsPage);
