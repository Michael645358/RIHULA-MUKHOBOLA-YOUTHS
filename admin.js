// Server-authenticated admin guard (Supabase Auth + role).
if (window.RihulaAdmin) {
    RihulaAdmin.requireAdmin();
}

async function loadStats() {

    const { count: memberCount } = await db
        .from("members")
        .select("*", { count: "exact", head: true });

    document.getElementById("totalMembers").innerText =
        memberCount || 0;

    const { data: contributions, error } = await db
        .from("contributions")
        .select("amount");

    console.log("Contributions Data:", contributions);
    console.log("Contributions Error:", error);

    let total = 0;

    (contributions || []).forEach(item => {
        total += Number(item.amount || 0);
    });

    console.log("Total Contributions:", total);

    document.getElementById("totalSavings").innerText =
        "KSh " + total.toLocaleString();
}

async function loadGroupSavings() {

    const { data, error } = await db
        .from("contributions")
        .select("amount");

    if (error) return;

    let total = 0; 

    data.forEach(item => {
        total += Number(item.amount);
    });

    const adminElement =
        document.getElementById("adminGroupSavings");

    if (adminElement) {
        adminElement.innerText =
            "KSh " + total.toLocaleString();
    }
}

window.onload = function () {

    loadStats();
    loadOnlineCount();
    loadGroupSavings();
    loadPendingMembers();
    loadAnnouncements();
    loadAnnouncementsList();
    loadLeadership();
    loadLeaderboard(); 

    
    if (document.getElementById("membersBody")) {
        loadMembers();
    }
};
async function editMember() {

    const phone =
        document.getElementById("editPhone").value;

    const name =
        document.getElementById("editName").value;

    const { error } = await db
        .from("members")
        .update({
            name: name
        })
        .eq("phone", phone);

    if (error) {
        showPopup(error.message, "error");
    } else {
        showPopup("Member updated successfully.", "success");
        if (typeof loadRecentActivity === "function") loadRecentActivity();
    }
}

async function editContribution() {

    const phone =
        document.getElementById(
            "editContributionPhone"
        ).value;

    const amount =
        document.getElementById(
            "editContributionAmount"
        ).value;

    const { error } = await db
        .from("contributions")
        .update({
            amount: amount
        })
        .eq("member_phone", phone);

    if (error) {
        showPopup(error.message, "error");
    } else {
        showPopup("Contribution updated successfully.", "success");
        if (typeof loadRecentActivity === "function") loadRecentActivity();
    }
}
async function loadMembers() {

    const { data, error } = await db
        .from("members")
        .select("*");

    if (error) {
        showPopup(error.message, "error");
        return;
    }

    const body =
        document.getElementById("membersBody");

    body.innerHTML = "";

    for (const member of data) {
        const { data: contributions } = await db
    .from("contributions")
    .select("amount")
    .eq("member_phone", member.phone);

let totalSavings = 0;

(contributions || []).forEach(item => {
    totalSavings += Number(item.amount || 0);
});

    body.innerHTML += `
<div class="member-card">
    <h3>${member.name}</h3>

    <p><strong>Phone:</strong> ${member.phone}</p>

    <p><strong>Role:</strong> ${member.role}</p>

    <p><strong>Status:</strong> ${member.status}</p>
    
    <p><strong>Total Saved:</strong> KSh${totalSavings}</p>

    <div class="member-actions">
<button
    onclick="viewHistory('${member.phone}','${member.name}')"
    class="btn">
    History
</button>

        <button
            onclick="deleteMember('${member.phone}')"
            class="btn">
            Delete
        </button>

    </div>
</div>
`;
    }
}
async function deleteMember(phone) {

    const confirmDelete = await showConfirm("Delete this member? This action cannot be undone.", { title: "Delete member", confirmText: "Delete", danger: true });

    if (!confirmDelete) return;

    const { error } = await db
        .from("members")
        .delete()
        .eq("phone", phone);

    if (error) {
        showPopup(error.message, "error");
    } else {
        showPopup("Member deleted successfully.", "success");
        if (typeof loadRecentActivity === "function") loadRecentActivity();
        loadMembers();
    }
}
async function approveMember(phone) {

    const { error } = await db
        .from("members")
        .update({
            status: "approved"
        })
        .eq("phone", phone);

    if (error) {
        showPopup(error.message, "error");
    } else {
        showPopup("Member approved successfully.", "success");
        if (typeof loadRecentActivity === "function") loadRecentActivity();

if (typeof loadMembers === "function") loadMembers();
if (typeof loadPendingMembers === "function") loadPendingMembers();
if (typeof loadDashboardStats === "function") loadDashboardStats();
if (typeof loadLeaderboard === "function") loadLeaderboard();
    }
}

async function rejectMember(phone) {

    const confirmed = await showConfirm(
        "Are you sure you want to reject this member?",
        { title: "Reject member", confirmText: "Reject", danger: true }
    );

    if (!confirmed) return;

    const { error } = await db
        .from("members")
        .update({ status: "rejected" })
        .eq("phone", phone);

    if (error) {
        showPopup(error.message, "error");
        return;
    }

    showPopup("Member rejected.", "success");


    if (typeof loadMembers === "function") loadMembers();
    if (typeof loadPendingMembers === "function") loadPendingMembers();
    if (typeof loadDashboardStats === "function") loadDashboardStats();
}

async function loadPendingMembers() {

    const { data, error } = await db
        .from("members")
        .select("*")
        .eq("status", "pending");

    if (error) {
        showPopup(error.message, "error");
        return;
    }

    const body =
        document.getElementById("pendingMembersBody");

    if (!body) return;

    body.innerHTML = "";
if (!data || data.length === 0) {

    body.innerHTML = `
        <div class="member-card">
            <h3>No Pending Members</h3>
            <p>All members have been approved.</p>
        </div>
    `;

    return;
}
data.forEach(member => {
        
    body.innerHTML += `
    <div class="member-card">
        <h3>${member.name}</h3>
        <p>${member.phone}</p>
        <p>Status: ${member.status}</p>

        <button onclick="approveMember('${member.phone}')"
                class="btn">
            Approve
        </button>

        <button onclick="rejectMember('${member.phone}')"
                class="btn">
            Reject
        </button>
    </div>
    `;

});
}
const slides = document.querySelectorAll(".slide");

let currentSlide = 0;

if (slides.length > 0) {

    setInterval(() => {

        slides[currentSlide].classList.remove("active");

        currentSlide++;

        if (currentSlide >= slides.length) {
            currentSlide = 0;
        }

        slides[currentSlide].classList.add("active");

    }, 4000);

}
function logout() {

    localStorage.removeItem("loggedUser");

    window.location.href = "login.html";
}
async function loadAnnouncements() {

    const { data, error } = await db
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.log(error.message);
        return;
    }

    const container =
        document.getElementById("announcementsContainer");

    if (!container) return;

    container.innerHTML = "";

    data.forEach(item => {

        container.innerHTML += `
<div class="announcement">

    <span class="date-badge">
        ${new Date(item.created_at).toLocaleDateString()}
    </span>

    <h3>${item.title}</h3>

    <p>${item.message}</p>

</div>
`;
    });

}
async function addAnnouncement() {

    const title =
        document.getElementById("announcementTitle").value;

    const message =
        document.getElementById("announcementMessage").value;

    if (!title || !message) {
        showPopup("Please fill in all required fields.", "warning");
        return;
    }

    const { error } = await db
        .from("announcements")
        .insert([
            {
                title: title,
                message: message
            }
        ]);

    if (error) {
        showPopup(error.message, "error");
    } else {

        showPopup("Announcement posted successfully.", "success");

        document.getElementById(
            "announcementTitle"
        ).value = "";

        document.getElementById(
            "announcementMessage"
        ).value = "";
        if (typeof loadRecentActivity === "function") loadRecentActivity();
    }
}
async function loadAnnouncementsList() {

    const { data, error } = await db
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        showPopup(error.message, "error");
        return;
    }

    const container =
        document.getElementById("announcementsList");

    if (!container) return;

    container.innerHTML = "";

    data.forEach(item => {

        container.innerHTML += `
        <div class="card">

            <h3>${item.title}</h3>

            <p>${item.message}</p>

            <button onclick="deleteAnnouncement(${item.id})">
    Delete
</button>

        </div>
        `;
    });
}
async function deleteAnnouncement(id) {

    const confirmDelete = await showConfirm("Delete this announcement? This action cannot be undone.", { title: "Delete announcement", confirmText: "Delete", danger: true });

    if (!confirmDelete) return;

    const { error } = await db
        .from("announcements")
        .delete()
        .eq("id", id);

    if (error) {
        showPopup("Could not delete the announcement: " + error.message, "error");
    } else {
        showPopup("Announcement deleted successfully.", "success");
        if (typeof loadRecentActivity === "function") loadRecentActivity();
        loadAnnouncementsList();
    }
}
async function loadLeadership() {

    const { data, error } = await db
        .from("leadership")
        .select("*");

    if (error) {
        showPopup(error.message, "error");
        return;
    }

    data.forEach(item => {

        const position = item.position.toLowerCase().trim();

        if (position === "chairman") {

            const chairmanPhoto = document.getElementById("chairmanPhoto");
            const chairmanName = document.getElementById("chairmanName");

            if (chairmanPhoto && item.photo_url) {
                chairmanPhoto.src = item.photo_url;
            }

            if (chairmanName) {
                chairmanName.innerText = item.name;
            }
        }

        if (position === "secretary") {

            const secretaryPhoto = document.getElementById("secretaryPhoto");
            const secretaryName = document.getElementById("secretaryName");

            if (secretaryPhoto && item.photo_url) {
                secretaryPhoto.src = item.photo_url;
            }

            if (secretaryName) {
                secretaryName.innerText = item.name;
            }
        }

        if (position === "treasurer") {

            const treasurerPhoto = document.getElementById("treasurerPhoto");
            const treasurerName = document.getElementById("treasurerName");

            if (treasurerPhoto && item.photo_url) {
                treasurerPhoto.src = item.photo_url;
            }

            if (treasurerName) {
                treasurerName.innerText = item.name;
            }
        }

        if (position === "organiser") {

            const organiserPhoto = document.getElementById("organiserPhoto");
            const organiserName = document.getElementById("organiserName");

            if (organiserPhoto && item.photo_url) {
                organiserPhoto.src = item.photo_url;
            }

            if (organiserName) {
                organiserName.innerText = item.name;
            }
        }

    });

}
async function loadDashboardStats() {

    // Total Members
    const { data: members } = await db
        .from("members")
        .select("*");

    const totalMembers =
document.getElementById("totalMembers");

if (totalMembers) {
    totalMembers.innerText =
        members ? members.length : 0;
}

    // Pending Members
    const { data: pending } = await db
        .from("members")
        .select("*")
        .eq("status", "pending");

     
    // Total Savings
    const { data: contributions } = await db
        .from("contributions")
        .select("amount");

    let totalSavings = 0;

    (contributions || []).forEach(item => {
        totalSavings += Number(item.amount || 0);
    });

    const totalSavingsElement = document.getElementById("totalSavings");

if (totalSavingsElement) {
    totalSavingsElement.innerText =
        "KSh " + totalSavings.toLocaleString();
}
}
loadDashboardStats();
async function viewHistory(phone, name) {

    const { data, error } = await db
        .from("contributions")
        .select("*")
        .eq("member_phone", phone)
        .order("created_at", { ascending: false });

    if (error) {
        showPopup(error.message, "error");
        return;
    }

    let historyText =
        "Contribution History for " + name + "\n\n";

    if (!data || data.length === 0) {

        historyText += "No contributions found.";

    } else {

        data.forEach(item => {

            historyText +=
                "KSh " + item.amount +
                " - " +
                new Date(item.created_at)
                    .toLocaleDateString()
                + "\n";
        });
    }

    showPopup(historyText, "info", "Contribution history", 6500);
}
function searchMembers() {

    const search =
        document.getElementById("memberSearch")
        .value
        .toLowerCase();

    const cards =
        document.querySelectorAll(".member-card");

    cards.forEach(card => {

        const text =
            card.innerText.toLowerCase();

        if (text.includes(search)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }

    });
}
async function addActivity(action) {
    if (window.RihulaAdmin && typeof RihulaAdmin.logActivity === "function") {
        return RihulaAdmin.logActivity(action);
    }
    return false;
}
async function loadOnlineCount() {

    const { data, error } = await db
        .from("members")
        .select("phone")
        .eq("online", true);

    if (error) return;

    const onlineMembers = document.getElementById("onlineMembers");

if (onlineMembers) {
    onlineMembers.innerText = data.length;
}
}

async function loadLeaderboard() {

    console.log("Leaderboard function running");

    const container =
        document.getElementById("leaderboardContainer");

    if (!container) {
        console.log("Container not found");
        return;
    }

    console.log("Container found");

    const { data: members } = await db
        .from("members")
        .select("*");

    const rankings = [];

    for (const member of members || []) {

        const { data: contributions } = await db
            .from("contributions")
            .select("amount")
            .eq("member_phone", member.phone);

        let total = 0;

        (contributions || []).forEach(item => {
            total += Number(item.amount || 0);
        });

        rankings.push({
            name: member.name,
            total: total
        });
    }

    rankings.sort((a, b) => b.total - a.total);

    container.innerHTML = "";

    rankings.forEach((member, index) => {

        let medal = "";

        if (index === 0) medal = "🥇";
        else if (index === 1) medal = "🥈";
        else if (index === 2) medal = "🥉";
        else medal = "#" + (index + 1);

        container.innerHTML += `
        <div class="leaderboard-card">
            <h3>${medal} ${member.name}</h3>
            <p>KSh ${member.total.toLocaleString()}</p>
        </div>
        `;
    });
}
async function loadHomeStats() {

    const memberCountElement = document.getElementById("memberCount");
    const totalContributionsElement = document.getElementById("totalContributions");

    // If we're not on the home page, stop.
    if (!memberCountElement || !totalContributionsElement) {
        return;
    }

    const { count: memberCount } = await db
        .from("members")
        .select("*", { count: "exact", head: true });

    memberCountElement.innerText = memberCount || 0;

    const { data } = await db
        .from("contributions")
        .select("amount");

    let total = 0;

    (data || []).forEach(item => {
        total += Number(item.amount || 0);
    });

    totalContributionsElement.innerText =
        "KSh " + total.toLocaleString();
}
if (document.getElementById("memberCount")) {
    loadHomeStats();
}
function showSection(sectionId) {

    // Hide all admin sections
    document.querySelectorAll(".admin-section").forEach(section => {
        section.style.display = "none";
    });

    // Show the selected section
    const selected = document.getElementById(sectionId);

    if (selected) {
        selected.style.display = "block";
    }

}

async function loadAdminGroupGoal() {
    const { data, error } = await db
        .from("settings")
        .select("group_goal")
        .eq("id", 1)
        .single();

    if (error) {
        console.error("Load group goal error:", error);
        return;
    }

    const goal = Number(data.group_goal || 0);

    const currentGoal = document.getElementById("adminCurrentGroupGoal");
    const input = document.getElementById("adminGroupGoalInput");

    if (currentGoal) {
        currentGoal.innerText = "KSh " + goal.toLocaleString();
    }

    if (input) {
        input.value = goal;
    }
}

async function updateGroupGoal() {
    const input = document.getElementById("adminGroupGoalInput");

    if (!input) {
        showPopup("Group goal input was not found.", "error");
        return;
    }

    const newGoal = Number(input.value);

    if (!newGoal || newGoal <= 0) {
        showPopup("Please enter a valid goal amount.", "warning");
        return;
    }

    const { error } = await db
        .from("settings")
        .update({ group_goal: newGoal })
        .eq("id", 1);

    if (error) {
        console.error("Update group goal error:", error);
        showPopup(
            "Failed to update group goal:\n" + error.message,
            "error"
        );
        return;
    }

    const currentGoal = document.getElementById("adminCurrentGroupGoal");

    if (currentGoal) {
        currentGoal.innerText = "KSh " + newGoal.toLocaleString();
    }

    if (typeof loadRecentActivity === "function") loadRecentActivity();

    showPopup(
        "Group goal updated successfully.\n\nNew goal: KSh " +
        newGoal.toLocaleString(),
        "success"
    );
}
async function recordWithdrawal() {
    const rawPhone = (document.getElementById("withdrawalPhone")?.value || "").trim();
    const amount = Number(document.getElementById("withdrawalAmount")?.value || 0);
    const reason = (document.getElementById("withdrawalReason")?.value || "").trim();

    const normalizePhone = (value) => {
        let p = String(value || "").replace(/[\s\-()]/g, "");
        if (p.startsWith("+254")) p = "0" + p.slice(4);
        else if (p.startsWith("254")) p = "0" + p.slice(3);
        return p;
    };

    const phone = normalizePhone(rawPhone);

    if (!phone) return showPopup("Please enter the member phone number.", "error");
    if (!Number.isFinite(amount) || amount <= 0) {
        return showPopup("Please enter a valid withdrawal amount.", "error");
    }
    if (amount > 10000000) {
        return showPopup("Withdrawal amount is above the allowed limit.", "error");
    }

    try {
        const admin = await RihulaAdmin.getAdminUser();
        if (!admin) return showPopup("Admin session expired. Please sign in again.", "error");

        // Accept the common Kenyan phone formats used by existing records:
        // 07..., 01..., 2547..., 2541..., +2547..., and +2541... . The database RPC also normalizes
        // numbers, so the admin lookup must use the same matching rule.
        const phoneCandidates = [
            phone,
            phone.startsWith("0") ? "254" + phone.slice(1) : phone,
            phone.startsWith("0") ? "+254" + phone.slice(1) : phone
        ].filter((value, index, list) => value && list.indexOf(value) === index);

        let memberQuery = db
            .from("members")
            .select("id, name, phone")
            .in("phone", phoneCandidates);

        const { data: members, error: memberError } = await memberQuery;
        if (memberError) throw memberError;

        // Keep the normalized comparison as the final guard in case the
        // stored value contains spaces, dashes, or parentheses.
        const normalizeForMatch = (value) =>
            String(value || "").replace(/\D/g, "").replace(/^254/, "0");

        const member = (members || []).find(
            (item) => normalizeForMatch(item.phone) === normalizeForMatch(phone)
        );

        if (memberError) throw memberError;
        if (!member) return showPopup("Member with that phone number was not found.", "error");

        const result = await window.processWithdrawal(phone, amount, reason || "Savings withdrawal");

        const balanceAfter = Number(result.balanceAfter || 0);

        showPopup(
            `KSh ${amount.toLocaleString("en-KE")} withdrawn from ${member.name}'s savings.\n\nRemaining savings: KSh ${balanceAfter.toLocaleString("en-KE")}`,
            "success"
        );

        ["withdrawalPhone", "withdrawalAmount", "withdrawalReason"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });

        if (typeof loadRecentActivity === "function") loadRecentActivity();

        if (typeof refreshRihulaFinance === "function") await refreshRihulaFinance();
        else {
            if (typeof loadDashboardStats === "function") await loadDashboardStats();
            if (typeof loadGroupSavings === "function") await loadGroupSavings();
            if (typeof loadLeaderboard === "function") await loadLeaderboard();
        }
    } catch (error) {
        console.error("Withdrawal error:", error);
        showPopup("Could not record withdrawal: " + (error?.message || error), "error");
    }
}
