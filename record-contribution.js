/* RIHULA - Record Contributions
 * Supports one or many approved members in a single batch.
 * No contribution is saved until the admin confirms the complete batch.
 */
(function () {
  "use strict";

  let members = [];
  const selected = new Map(); // member id -> { member, amount }
  let confirmResolver = null;

  const $ = (id) => document.getElementById(id);

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function money(value) {
    return Number(value).toLocaleString("en-KE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  function notify(message, type) {
    if (typeof window.showPopup === "function") window.showPopup(message, type || "info");
    else if (typeof window.RihulaPopups !== "undefined") window.RihulaPopups.info(message);
  }

  function getMember(id) {
    return members.find(m => String(m.id) === String(id));
  }

  function closeMemberPicker() {
    $("memberPicker")?.classList.remove("open");
    $("memberSearch")?.blur();
  }

  function renderMemberResults(term = "") {
    const list = $("memberResults");
    if (!list) return;
    const q = String(term).trim().toLowerCase();

    const results = members.filter(member => {
      if (selected.has(String(member.id))) return false;
      if (!q) return true;
      return String(member.name || "").toLowerCase().includes(q) ||
             String(member.phone || "").toLowerCase().includes(q);
    });

    if (!results.length) {
      list.innerHTML = `<div class="member-result-empty">No approved member found.</div>`;
      return;
    }

    list.innerHTML = results.map(member => `
      <button type="button" class="member-result" data-member-id="${esc(member.id)}">
        <span class="member-result-avatar">${esc(String(member.name || "?").trim().charAt(0).toUpperCase())}</span>
        <span class="member-result-text">
          <strong>${esc(member.name)}</strong>
          <small>${esc(member.phone)}</small>
        </span>
        <span class="member-result-add">＋</span>
      </button>
    `).join("");
  }

  function openMemberPicker() {
    const picker = $("memberPicker");
    if (!picker) return;
    picker.classList.add("open");
    const search = $("memberSearch");
    if (search) {
      search.value = "";
      renderMemberResults("");
      setTimeout(() => search.focus(), 0);
    }
  }

  function renderSelected() {
    const container = $("selectedMembersList");
    const empty = $("selectedEmpty");
    if (!container) return;

    container.querySelectorAll(".selected-member-row").forEach(el => el.remove());

    if (!selected.size) {
      if (empty) empty.style.display = "block";
    } else {
      if (empty) empty.style.display = "none";
      selected.forEach((entry, id) => {
        const member = entry.member;
        const row = document.createElement("div");
        row.className = "selected-member-row";
        row.dataset.memberId = String(id);
        row.innerHTML = `
          <div class="selected-member-main">
            <div class="selected-member-avatar">${esc(String(member.name || "?").trim().charAt(0).toUpperCase())}</div>
            <div class="selected-member-info">
              <strong>${esc(member.name)}</strong>
              <span>${esc(member.phone)}</span>
            </div>
          </div>
          <div class="selected-member-amount-wrap">
            <span>KSh</span>
            <input class="selected-member-amount" type="number" min="1" step="0.01" inputmode="decimal" placeholder="Amount" value="${entry.amount ? esc(entry.amount) : ""}" aria-label="Contribution amount for ${esc(member.name)}">
          </div>
          <button type="button" class="remove-member" aria-label="Remove ${esc(member.name)}">×</button>
        `;
        container.appendChild(row);
      });
    }

    updateTotals();
    updateRecordButton();
  }

  function updateTotals() {
    let total = 0;
    let complete = 0;
    selected.forEach(entry => {
      const amount = Number(entry.amount);
      if (Number.isFinite(amount) && amount > 0) {
        total += amount;
        complete++;
      }
    });
    const count = selected.size;
    if ($("selectedCount")) $("selectedCount").textContent = String(count);
    if ($("totalAmount")) $("totalAmount").textContent = `KSh ${money(total)}`;
    if ($("completeCount")) $("completeCount").textContent = `${complete}/${count} amounts entered`;
  }

  function updateRecordButton() {
    const btn = $("reviewContributionsBtn");
    if (!btn) return;
    btn.disabled = selected.size === 0;
    btn.textContent = selected.size > 1 ? "Review Contributions" : "Review Contribution";
  }

  function addMember(id) {
    const member = getMember(id);
    if (!member || selected.has(String(id))) return;
    selected.set(String(id), { member, amount: "" });
    closeMemberPicker();
    renderSelected();
    const firstEmpty = document.querySelector(".selected-member-amount[value='']");
    if (firstEmpty) firstEmpty.focus();
  }

  function removeMember(id) {
    selected.delete(String(id));
    renderSelected();
  }

  function collectBatch() {
    const rows = [...document.querySelectorAll(".selected-member-row")];
    const batch = [];
    const errors = [];

    rows.forEach(row => {
      const id = String(row.dataset.memberId);
      const entry = selected.get(id);
      if (!entry) return;
      const input = row.querySelector(".selected-member-amount");
      const raw = input?.value ?? "";
      entry.amount = raw;
      const amount = Number(raw);
      if (!Number.isFinite(amount) || amount <= 0) {
        errors.push(`${entry.member.name}: enter an amount greater than KSh 0.`);
      } else {
        batch.push({ id, member: entry.member, amount });
      }
    });

    updateTotals();
    return { batch, errors };
  }

  function openConfirmModal(batch) {
    return new Promise(resolve => {
      const overlay = $("contributionConfirmOverlay");
      const body = $("confirmationItems");
      if (!overlay || !body) return resolve(false);

      const total = batch.reduce((sum, item) => sum + item.amount, 0);
      body.innerHTML = batch.map(item => `
        <div class="confirmation-item">
          <div>
            <strong>${esc(item.member.name)}</strong>
            <small>${esc(item.member.phone)}</small>
          </div>
          <strong>KSh ${money(item.amount)}</strong>
        </div>
      `).join("");

      $("confirmMemberCount").textContent = `${batch.length} member${batch.length === 1 ? "" : "s"}`;
      $("confirmTotalAmount").textContent = `KSh ${money(total)}`;
      confirmResolver = resolve;
      overlay.classList.add("open");
      overlay.setAttribute("aria-hidden", "false");
      setTimeout(() => $("confirmContributionSave")?.focus(), 0);
    });
  }

  function finishConfirm(result) {
    const resolve = confirmResolver;
    confirmResolver = null;
    const overlay = $("contributionConfirmOverlay");
    if (overlay) {
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
    }
    const save = $("confirmContributionSave");
    if (save) {
      save.disabled = false;
      save.textContent = "Confirm & Save";
    }
    if (resolve) resolve(result);
  }

  async function verifyMembers(ids) {
    if (!window.db) throw new Error("Database connection is not ready. Refresh the page.");
    const { data, error } = await db
      .from("members")
      .select("id,name,phone,status")
      .in("id", ids);
    if (error) throw error;

    const approved = new Map((data || [])
      .filter(m => String(m.status || "").trim().toLowerCase() === "approved")
      .map(m => [String(m.id), m]));

    if (approved.size !== ids.length) {
      const missing = ids.filter(id => !approved.has(String(id)));
      const names = missing.map(id => selected.get(String(id))?.member?.name || "Selected member");
      throw new Error(`These member(s) are no longer approved: ${names.join(", ")}. Nothing was saved.`);
    }
    return approved;
  }

  async function loadApprovedMembers() {
    const status = $("memberLoadStatus");
    if (!window.db) {
      if (status) status.textContent = "Database connection is not ready. Refresh the page.";
      return;
    }
    try {
      const { data, error } = await db
        .from("members")
        .select("id,name,phone,status,role")
        .order("name", { ascending: true });
      if (error) throw error;

      members = (data || []).filter(m =>
        m.id != null &&
        String(m.name || "").trim() &&
        String(m.phone || "").trim() &&
        String(m.status || "").trim().toLowerCase() === "approved"
      );

      if (status) status.textContent = members.length
        ? `${members.length} approved member${members.length === 1 ? "" : "s"} available`
        : "No approved members available.";
      renderMemberResults("");
    } catch (error) {
      members = [];
      console.error("RIHULA: Could not load approved members", error);
      if (status) status.textContent = "Could not load members. Please refresh and try again.";
      notify("Could not load approved members: " + (error.message || error), "error");
    }
  }


  function normalizeKenyanPhone(raw) {
    let s = String(raw ?? "").trim().replace(/[\s()\-]/g, "");
    if (!s) return null;
    if (s.startsWith("+254")) s = s.slice(1);
    if (s.startsWith("254")) return /^254(?:1|7)\d{8}$/.test(s) ? s : null;
    if (/^0(?:1|7)\d{8}$/.test(s)) return "254" + s.slice(1);
    return null;
  }

  function contributionWhatsAppMessage(member, amount, dateText) {
    return `Hello ${member.name || "RIHULA Member"},\n\nThank you for your commitment to RIHULA Mukhobola Association. This is to confirm that your contribution of KSh ${money(amount)} has been successfully recorded on ${dateText}.\n\nPlease keep your payment confirmation for your records. If you have any question about your savings, kindly contact the RIHULA administration.\n\nThank you for saving consistently with RIHULA.\nSave. Grow. Belong. 💚`;
  }

  function openContributionWhatsApp(member, amount, dateText) {
    const phone = normalizeKenyanPhone(member.phone);
    if (!phone) {
      notify(`${member.name || "This member"} has an invalid Kenyan phone number.`, "warning");
      return;
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(contributionWhatsAppMessage(member, amount, dateText))}`;
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) {
      notify("Your browser blocked WhatsApp. Allow pop-ups for RIHULA and try again.", "warning");
      return;
    }
    try { window.RihulaAdmin?.logActivity?.(`Opened WhatsApp contribution confirmation for: ${member.name}`); } catch (_) {}
  }

  function showContributionWhatsApp(targets) {
    const overlay = $("waContributionOverlay");
    const list = $("waContributionList");
    if (!overlay || !list || !targets.length) return;

    const dateText = new Intl.DateTimeFormat("en-KE", {
      day: "2-digit", month: "long", year: "numeric"
    }).format(new Date());

    list.innerHTML = targets.map((item, index) => {
      const member = item.member;
      const valid = !!normalizeKenyanPhone(member.phone);
      return `<div class="wa-contrib-item">
        <div class="wa-contrib-info">
          <strong>${esc(member.name)}</strong>
          <small>KSh ${money(item.amount)} • ${esc(member.phone || "No phone")}</small>
        </div>
        <button type="button" class="wa-contrib-send" data-wa-index="${index}" ${valid ? "" : "disabled"}>💬 WhatsApp</button>
      </div>`;
    }).join("");

    list.querySelectorAll("[data-wa-index]").forEach(button => {
      button.addEventListener("click", () => {
        const item = targets[Number(button.dataset.waIndex)];
        if (item) openContributionWhatsApp(item.member, item.amount, dateText);
      });
    });

    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeContributionWhatsApp() {
    const overlay = $("waContributionOverlay");
    if (!overlay) return;
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
  }

  async function saveBatch() {
    const { batch, errors } = collectBatch();
    if (!batch.length || errors.length) {
      notify(errors[0] || "Select at least one member and enter an amount.", "warning");
      return;
    }

    const ids = batch.map(item => item.id);
    const approvedNow = await verifyMembers(ids);
    const finalBatch = batch.map(item => ({
      member: approvedNow.get(item.id),
      amount: item.amount
    }));

    // One final database verification immediately before INSERT.
    const finalCheck = await verifyMembers(ids);
    const rows = finalBatch.map(item => ({
      member_phone: finalCheck.get(String(item.member.id)).phone,
      amount: item.amount
    }));

    const { error } = await db.from("contributions").insert(rows);
    if (error) throw error;

    const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const whatsappTargets = finalBatch.map(item => ({
      member: finalCheck.get(String(item.member.id)),
      amount: item.amount
    })).filter(item => item.member);
    notify(`${rows.length} contribution${rows.length === 1 ? "" : "s"} recorded successfully. Total: KSh ${money(total)}`, "success");
    selected.clear();
    renderSelected();
    setTimeout(() => showContributionWhatsApp(whatsappTargets), 250);

    try { await window.refreshRihulaFinance?.(); } catch (_) {}
    try { window.loadLeaderboard?.(); } catch (_) {}
    try { window.loadStats?.(); } catch (_) {}
    try { window.loadDashboardStats?.(); } catch (_) {}
    try { window.loadRecentActivity?.(); } catch (_) {}
  }

  async function reviewContributions() {
    const { batch, errors } = collectBatch();
    if (!selected.size) {
      notify("Please add at least one approved member.", "warning");
      return;
    }
    if (errors.length) {
      notify(errors[0], "warning");
      return;
    }

    const button = $("reviewContributionsBtn");
    if (button) button.disabled = true;
    try {
      // Check before confirmation too, so the confirmation reflects currently approved members.
      const verified = await verifyMembers(batch.map(item => item.id));
      batch.forEach(item => { item.member = verified.get(item.id); });
      const confirmed = await openConfirmModal(batch);
      if (!confirmed) return;

      if ($("confirmContributionSave")) {
        $("confirmContributionSave").disabled = true;
        $("confirmContributionSave").textContent = "Saving...";
      }
      await saveBatch();
    } catch (error) {
      console.error("RIHULA: Batch contribution save failed", error);
      notify("Could not save contributions: " + (error.message || error), "error");
    } finally {
      if (button) button.disabled = selected.size === 0;
      updateRecordButton();
    }
  }

  window.recordContribution = reviewContributions;
  window.loadApprovedContributionMembers = loadApprovedMembers;

  document.addEventListener("DOMContentLoaded", () => {
    if (!$('selectedMembersList') || !$('reviewContributionsBtn')) return;

    $("addMemberBtn")?.addEventListener("click", openMemberPicker);
    $("closeMemberPicker")?.addEventListener("click", closeMemberPicker);
    $("memberSearch")?.addEventListener("input", e => renderMemberResults(e.target.value));
    $("memberSearch")?.addEventListener("keydown", e => {
      if (e.key === "Escape") closeMemberPicker();
    });
    $("memberResults")?.addEventListener("click", e => {
      const result = e.target.closest("[data-member-id]");
      if (result) addMember(result.dataset.memberId);
    });
    $("memberPicker")?.addEventListener("click", e => {
      if (e.target.id === "memberPicker") closeMemberPicker();
    });

    $("selectedMembersList")?.addEventListener("click", e => {
      const remove = e.target.closest(".remove-member");
      if (remove) removeMember(remove.closest(".selected-member-row")?.dataset.memberId);
    });

    $("selectedMembersList")?.addEventListener("input", e => {
      if (!e.target.classList.contains("selected-member-amount")) return;
      const id = e.target.closest(".selected-member-row")?.dataset.memberId;
      const entry = selected.get(String(id));
      if (entry) entry.amount = e.target.value;
      updateTotals();
    });

    $("reviewContributionsBtn")?.addEventListener("click", reviewContributions);
    $("confirmContributionCancel")?.addEventListener("click", () => finishConfirm(false));
    $("confirmContributionSave")?.addEventListener("click", () => finishConfirm(true));
    $("waContributionClose")?.addEventListener("click", closeContributionWhatsApp);
    $("waContributionOverlay")?.addEventListener("click", e => {
      if (e.target === $("waContributionOverlay")) closeContributionWhatsApp();
    });
    $("contributionConfirmOverlay")?.addEventListener("click", e => {
      if (e.target === $("contributionConfirmOverlay")) finishConfirm(false);
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        if ($("waContributionOverlay")?.classList.contains("open")) closeContributionWhatsApp();
        else if ($("contributionConfirmOverlay")?.classList.contains("open")) finishConfirm(false);
        else closeMemberPicker();
      }
    });

    loadApprovedMembers();
    renderSelected();
  });
})();
