
console.log("DB:", db);
async function addMember() {

    const name =
    document.getElementById("memberName").value.trim();

const phone =
    document.getElementById("memberPhone").value.trim();

const password =
    document.getElementById("memberPassword").value;

const answer1 =
    document.getElementById("answer1").value;

const answer2 =
    document.getElementById("answer2").value;

const idNumber =
    document.getElementById("idNumber").value;

    console.log("Supabase object:", supabase);

    try {

        const { error } = await db
            .from("members")
            .insert([
                {
    name: name,
    phone: phone,
    password: password,
    answer1: answer1,
    answer2: answer2,
    id_number: idNumber,
    role: "member",
    status: "pending"
}
            ]);

        if (error) {
            showPopup("SUPABASE ERROR: " + error.message);
        } else {
            showPopup("Member Added Successfully");
        }

    } catch(err) {
        showPopup("CATCH ERROR: " + err.message);
    }
}
async function recordContribution() {

    const phone =
        document.getElementById("contributorPhone").value;

    const amount =
        document.getElementById("contributionAmount").value;

    if (!phone || !amount) {
        showPopup("Fill all fields");
        return;
    }

    const { error } = await db
        .from("contributions")
        .insert([
            {
                member_phone: phone,
                amount: amount
            }
        ]);

    if (error) {
        showPopup("ERROR: " + error.message);
    } else {

        showPopup("Contribution Saved Successfully");

        document.getElementById("contributorPhone").value = "";
        document.getElementById("contributionAmount").value = "";

        await window.refreshRihulaFinance?.();
        loadLeaderboard();
        loadStats();
        loadDashboardStats();

    }
}
async function loadStats() {

    const { count: memberCount } = await db
        .from("members")
        .select("*", { count: "exact", head: true });

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

    const totalMembers = document.getElementById("totalMembers");

    if (totalMembers) {
        totalMembers.innerText = memberCount || 0;
    }

    const totalSavings = document.getElementById("totalSavings");

    if (totalSavings) {
        totalSavings.innerText = "KSh " + total.toLocaleString();
    }
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

    if (typeof loadOnlineCount === "function") {
        loadOnlineCount();
    }

    loadGroupSavings();
    loadPendingMembers();
if (typeof loadAnnouncements === "function") {
    loadAnnouncements();
}

if (typeof loadAnnouncementsList === "function") {
    loadAnnouncementsList();
}

if (typeof loadLeadership === "function") {
    loadLeadership();
}

if (typeof loadLeaderboard === "function") {
    loadLeaderboard();
}

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
        showPopup(error.message);
    } else {
        showPopup("Member Updated Successfully");
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
        showPopup(error.message);
    } else {
        showPopup("Contribution Updated Successfully");
    }
}
async function loadMembers() {

    const { data, error } = await db
        .from("members")
        .select("*");

    if (error) {
        showPopup(error.message);
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

    const confirmDelete =
        confirm("Delete this member?");

    if (!confirmDelete) return;

    const { error } = await db
        .from("members")
        .delete()
        .eq("phone", phone);

    if (error) {
        showPopup(error.message);
    } else {
        showPopup("Member Deleted");
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
        showPopup(error.message);
    } else {
        showPopup("Member Approved");

await addActivity(
    "Approved member: " + phone
);

loadMembers();
loadPendingMembers();
loadDashboardStats();
loadLeaderboard();
    }
}
async function loadPendingMembers() {

    const body = document.getElementById("pendingMembersBody");

    if (!body) return;

    body.innerHTML = "<p></p>";

    const { data, error } = await db
        .from("members")
        .select("*")
        .eq("status", "pending");

    if (error) {
        body.innerHTML = `
            <div class="member-card">
                <h3>Error</h3>
                <p>${error.message}</p>
            </div>
        `;
        return;
    }

    body.innerHTML = "";

    if (!data || data.length === 0) {

        body.innerHTML = `
            <div class="member-card">
                <h3>✅ No Pending Members</h3>
                <p>All members have been approved.</p>
            </div>
        `;

        return;
    }

    data.forEach(member => {

        body.innerHTML += `
        <div class="member-card">
            <h3>${member.name}</h3>
            <p><strong>Phone:</strong> ${member.phone}</p>
            <p><strong>Status:</strong> ${member.status}</p>

            <button class="btn"
                onclick="approveMember('${member.phone}')">
                Approve
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

    const user = JSON.parse(localStorage.getItem("loggedUser"));

    if (user) {
        db.from("members")
          .update({
              online: false,
              last_seen: new Date().toISOString()
          })
          .eq("phone", user.phone);
    }

    localStorage.removeItem("loggedUser");
    sessionStorage.removeItem("adminVerified");

    window.location.href = "login.html";
}async function loadPendingContributions() {

    const container = document.getElementById("pendingContributions");

    if (!container) return;

    container.innerHTML = "";

    const { data, error } = await db
        .from("pending_contributions")
        .select("*")
        .eq("status", "Pending")
        .order("created_at", { ascending: false });

    if (error) {
        container.innerHTML = "Failed to load requests.";
        return;
    }

    if (!data.length) {
        container.innerHTML = "<p>No pending contributions.</p>";
        return;
    }

    container.innerHTML = "";

    data.forEach(item => {

        container.innerHTML += `

        <div class="card">

            <h3>${item.member_name}</h3>

            <p><strong>Phone:</strong> ${item.phone}</p>

            <p><strong>Amount:</strong> KSh ${item.amount}</p>

            <button class="btn"
                onclick="approveContribution(${item.id})">
                ✅ Approve
            </button>

            <button class="btn"
                onclick="rejectContribution(${item.id})">
                ❌ Reject
            </button>

        </div>

        `;
    });

}

document.addEventListener("DOMContentLoaded", () => {
    loadPendingContributions();
});