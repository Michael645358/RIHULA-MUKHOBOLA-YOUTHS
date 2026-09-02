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

    const confirmDelete = await showConfirm("Delete this member? This action cannot be undone.", { title: "Delete member", confirmText: "Delete", danger: true });

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
function normalizeKenyanWhatsAppPhone(raw) {
    let value = String(raw || "").trim().replace(/[^0-9+]/g, "");
    if (!value) return "";

    if (value.startsWith("+254")) return value.slice(1);
    if (value.startsWith("254")) return value;
    if (value.startsWith("0") && value.length === 10) return "254" + value.slice(1);

    return "";
}

function escapeWhatsAppHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showMemberApprovalWhatsApp(member) {
    const phone = normalizeKenyanWhatsAppPhone(member?.phone);
    if (!phone) {
        showPopup("Member has no valid Kenyan WhatsApp number.", "error");
        return;
    }

    const name = String(member?.name || "RIHULA Member").trim();
    const defaultMessage =
`Hello ${name},\n\nCongratulations! 🎉 Your membership in RIHULA Mukhobola Association has been approved.\n\nYou are now an approved member of the RIHULA family. We look forward to your active participation and commitment to our savings and community goals.\n\nThank you for choosing to Save. Grow. Belong. 💚\n\nRIHULA Mukhobola Association`;

    const existing = document.getElementById("rihulaApprovalWhatsAppModal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "rihulaApprovalWhatsAppModal";
    modal.innerHTML = `
      <div class="rihula-wa-overlay" data-close-wa>
        <div class="rihula-wa-dialog" role="dialog" aria-modal="true" aria-labelledby="rihula-wa-title">
          <div class="rihula-wa-head">
            <div>
              <h3 id="rihula-wa-title">📱 WhatsApp Approval</h3>
              <p>Member approved successfully. You can send a confirmation message.</p>
            </div>
            <button type="button" class="rihula-wa-close" data-close-wa aria-label="Close">×</button>
          </div>
          <label class="rihula-wa-label" for="rihulaApprovalMessage">Message</label>
          <textarea id="rihulaApprovalMessage" class="rihula-wa-textarea" rows="11">${escapeWhatsAppHtml(defaultMessage)}</textarea>
          <div class="rihula-wa-meta">To: <strong>${escapeWhatsAppHtml(name)}</strong> · ${escapeWhatsAppHtml(member.phone)}</div>
          <div class="rihula-wa-actions">
            <button type="button" class="btn" data-close-wa>Close</button>
            <button type="button" class="btn rihula-wa-send" id="rihulaSendApprovalWhatsApp">💬 Open WhatsApp</button>
          </div>
        </div>
      </div>`;

    const style = document.createElement("style");
    style.id = "rihulaApprovalWhatsAppStyles";
    style.textContent = `
      .rihula-wa-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:18px;z-index:99999}
      .rihula-wa-dialog{width:min(620px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 18px 60px rgba(0,0,0,.25);padding:20px}
      .rihula-wa-head{display:flex;gap:14px;justify-content:space-between;align-items:flex-start;margin-bottom:14px}
      .rihula-wa-head h3{margin:0 0 5px;font-size:20px}.rihula-wa-head p{margin:0;color:#667085;font-size:13px}
      .rihula-wa-close{border:0;background:transparent;font-size:28px;line-height:1;cursor:pointer;color:#667085}
      .rihula-wa-label{display:block;font-weight:700;margin:10px 0 7px}.rihula-wa-textarea{width:100%;box-sizing:border-box;resize:vertical;border:1px solid #d0d5dd;border-radius:12px;padding:12px;font:inherit;line-height:1.45;min-height:230px}
      .rihula-wa-meta{margin-top:9px;color:#667085;font-size:13px}.rihula-wa-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px;flex-wrap:wrap}
      .rihula-wa-send{font-weight:700}
      @media(max-width:520px){.rihula-wa-dialog{padding:16px}.rihula-wa-actions button{width:100%}}`;
    document.head.appendChild(style);
    document.body.appendChild(modal);

    modal.querySelectorAll("[data-close-wa]").forEach(el => {
        el.addEventListener("click", (event) => {
            if (event.target === el || el.hasAttribute("data-close-wa")) modal.remove();
        });
    });

    document.getElementById("rihulaSendApprovalWhatsApp").addEventListener("click", () => {
        const message = document.getElementById("rihulaApprovalMessage").value.trim();
        if (!message) {
            showPopup("Please enter a WhatsApp message.", "warning");
            return;
        }
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank", "noopener,noreferrer");
        modal.remove();
    });
}

async function approveMember(phone) {
    const { data: member, error: memberError } = await db
        .from("members")
        .select("id,name,phone,email,status")
        .eq("phone", phone)
        .maybeSingle();

    if (memberError) {
        showPopup(memberError.message, "error");
        return;
    }

    if (!member) {
        showPopup("Member could not be found.", "error");
        return;
    }

    if (String(member.status || "").toLowerCase() !== "pending") {
        showPopup("This member is no longer pending.", "warning");
        if (typeof loadPendingMembers === "function") loadPendingMembers();
        return;
    }

    const { error } = await db
        .from("members")
        .update({ status: "approved" })
        .eq("phone", phone)
        .eq("status", "pending");

    if (error) {
        showPopup(error.message, "error");
        return;
    }

    showPopup("Member Approved", "success");

    if (typeof loadMembers === "function") loadMembers();
    if (typeof loadPendingMembers === "function") loadPendingMembers();
    if (typeof loadDashboardStats === "function") loadDashboardStats();
    if (typeof loadLeaderboard === "function") loadLeaderboard();

    setTimeout(() => showMemberApprovalWhatsApp(member), 250);
}
async function rejectMember(phone) {

    const confirmed = await showConfirm("Are you sure you want to reject this member?", { title: "Reject member", confirmText: "Reject", danger: true, icon: "⚠" });

    if (!confirmed) return;

    const { error } = await db
        .from("members")
        .update({
            status: "rejected"
        })
        .eq("phone", phone);

    if (error) {
        showPopup(error.message);
    } else {
        showPopup("Member Rejected");


        if (typeof loadMembers === "function") loadMembers();
        if (typeof loadPendingMembers === "function") loadPendingMembers();
        if (typeof loadDashboardStats === "function") loadDashboardStats();
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
    ✅ Approve
</button>

<button class="btn"
    onclick="rejectMember('${member.phone}')">
    ❌ Reject
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
}
