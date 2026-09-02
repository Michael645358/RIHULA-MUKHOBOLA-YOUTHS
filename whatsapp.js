/* RIHULA Free WhatsApp Members
 * Uses WhatsApp Click-to-Chat only. No WhatsApp API and no automatic sending.
 */
(function () {
  "use strict";

  let allMembers = [];
  let queue = [];
  let queueIndex = 0;

  function esc(value) {
    return String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
  }

  function normalizeKenyanPhone(raw) {
    let s = String(raw ?? "").trim().replace(/[\s()\-]/g, "");
    if (!s) return null;
    if (s.startsWith("+254")) s = s.slice(1);
    if (s.startsWith("254")) {
      return /^254(?:1|7)\d{8}$/.test(s) ? s : null;
    }
    if (/^0(?:1|7)\d{8}$/.test(s)) return "254" + s.slice(1);
    return null;
  }

  const TEMPLATES = {
    custom: `Hello {name},

This is a message from RIHULA Mukhobola Association.

Regards,
RIHULA Mukhobola Association`,
    contribution: `Hello {name},

Thank you for your commitment to RIHULA Mukhobola Association. This is to confirm that your contribution of {amount} has been received on {date}.

Please keep your payment confirmation for your records. If you have any question about your savings, kindly contact the RIHULA administration.

Thank you for saving consistently with RIHULA.
Save. Grow. Belong. 💚`,
    approval: `Hello {name},

Congratulations! 🎉 Your membership application to RIHULA Mukhobola Association has been approved.

You are now officially part of the RIHULA family. Please keep your account details safe and follow the association's contribution and membership guidelines.

Welcome to RIHULA — Save. Grow. Belong. 💚`,
    reminder: `Hello {name},

This is a friendly reminder from RIHULA Mukhobola Association that your contribution of {amount} is due on {date}.

Payment instructions: {payment}

Kindly make your contribution on time and keep your payment confirmation for your records. Every contribution helps strengthen our group savings.

Thank you for your continued commitment to RIHULA. 💚`,
    meeting: `Hello {name},

RIHULA Mukhobola Association would like to remind you about our upcoming meeting.

Meeting details: {meeting}
Date: {date}

Please make every effort to attend on time and participate in the discussions. Your presence and contribution to the association are valued.

Regards,
RIHULA Mukhobola Association 💚`,
    announcement: `Hello {name},

📢 RIHULA Mukhobola Association has an important announcement for you.

{meeting}

Please take note of the information above and follow any instructions provided by the association. For clarification, kindly contact the RIHULA administration.

Thank you.
RIHULA Mukhobola Association 💚`,
    welcome: `Hello {name},

Welcome to RIHULA Mukhobola Association! 🎉 We are pleased to have you as a member of our growing community.

Please participate actively in our savings activities, keep your account information secure, and stay updated through the RIHULA platform.

We look forward to growing together.
Save. Grow. Belong. 💚`,
    payment: `Hello {name},

RIHULA Mukhobola Association payment information:

Amount: {amount}
Due date: {date}
Payment instructions: {payment}

After making your payment, please keep the transaction confirmation for your records and follow any RIHULA confirmation procedure provided by the administration.

Thank you for your cooperation. 💚`
  };

  function messageFor(name) {
    const base = document.getElementById("waMessage")?.value.trim() || "";
    const values = {
      name: name || "RIHULA Member",
      amount: document.getElementById("waAmount")?.value.trim() || "the stated contribution amount",
      date: document.getElementById("waDate")?.value.trim() || "the stated date",
      payment: document.getElementById("waPayment")?.value.trim() || "the official RIHULA payment instructions",
      meeting: document.getElementById("waMeeting")?.value.trim() || "the meeting details shared by RIHULA"
    };
    return base.replace(/\{(name|amount|date|payment|meeting)\}/g, (_, key) => values[key]);
  }

  function applyTemplate(value) {
    const message = document.getElementById("waMessage");
    const select = document.getElementById("waTemplate");
    if (!message) return;

    const key = value || select?.value || "custom";
    const templateText = Object.prototype.hasOwnProperty.call(TEMPLATES, key)
      ? TEMPLATES[key]
      : TEMPLATES.custom;

    // Always put the selected template into the message box immediately.
    message.value = templateText;
    message.dispatchEvent(new Event("input", { bubbles: true }));
    message.focus();
  }

  function waUrl(member) {
    const phone = normalizeKenyanPhone(member.phone);
    if (!phone) return null;
    return "https://wa.me/" + phone + "?text=" + encodeURIComponent(messageFor(member.name));
  }

  function selectedMembers() {
    const ids = [...document.querySelectorAll(".wa-check:checked")].map(x => String(x.value));
    return allMembers.filter(m => ids.includes(String(m.id)) && waUrl(m));
  }

  function updateCount() {
    const checked = document.querySelectorAll(".wa-check:checked").length;
    const valid = selectedMembers().length;
    const count = document.getElementById("waSelectedCount");
    if (count) count.textContent = checked ? `${checked} selected${valid !== checked ? ` • ${checked-valid} invalid number${checked-valid===1?'':'s'}` : ""}` : "0 selected";
    const open = document.getElementById("waOpenSelected");
    if (open) open.disabled = valid === 0;
  }

  function render() {
    const body = document.getElementById("waMembersList");
    if (!body) return;
    if (!allMembers.length) {
      body.innerHTML = '<div class="wa-empty">No members found.</div>';
      return;
    }
    body.innerHTML = allMembers.map(member => {
      const valid = !!normalizeKenyanPhone(member.phone);
      return `<div class="wa-member">
        <input class="wa-check" type="checkbox" value="${esc(member.id)}" ${valid ? "" : "disabled"} aria-label="Select ${esc(member.name)}">
        <div class="wa-member-main"><div class="wa-member-name">${esc(member.name)}</div><div class="wa-member-phone">${esc(member.phone || "No phone number")}</div></div>
        <span class="wa-status">${valid ? "Ready" : "Invalid number"}</span>
        <button class="wa-send" type="button" data-id="${esc(member.id)}" ${valid ? "" : "disabled"}>💬 WhatsApp</button>
      </div>`;
    }).join("");
    body.querySelectorAll(".wa-check").forEach(el => el.addEventListener("change", updateCount));
    body.querySelectorAll(".wa-send").forEach(btn => btn.addEventListener("click", () => openMember(btn.dataset.id)));
    updateCount();
  }

  async function loadMembers() {
    const body = document.getElementById("waMembersList");
    try {
      if (typeof window.waitForRihulaDb === "function") await window.waitForRihulaDb();
      if (!window.db) throw new Error("Supabase is not initialized.");
      const { data, error } = await window.db.from("members").select("id,name,phone,status").order("name", { ascending: true });
      if (error) throw error;
      allMembers = (data || []).filter(m => String(m.status || "").toLowerCase() !== "blocked");
      render();
      const total = document.getElementById("waTotalCount");
      if (total) total.textContent = allMembers.length;
    } catch (error) {
      console.error("RIHULA WhatsApp members:", error);
      if (body) body.innerHTML = `<div class="wa-error">Unable to load members.<br><small>${esc(error.message || error)}</small></div>`;
    }
  }

  function openMember(id) {
    const member = allMembers.find(m => String(m.id) === String(id));
    if (!member) return;
    const url = waUrl(member);
    if (!url) return toast("This member has an invalid Kenyan phone number.");
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) return toast("Your browser blocked the WhatsApp window. Allow pop-ups for RIHULA.");
    if (window.RihulaAdmin?.logActivity) window.RihulaAdmin.logActivity("Opened WhatsApp chat for: " + member.name);
  }

  function openSelected() {
    queue = selectedMembers();
    queueIndex = 0;
    if (!queue.length) return toast("Select at least one member with a valid Kenyan phone number.");
    openNext();
  }

  function openNext() {
    if (!queue.length || queueIndex >= queue.length) {
      toast("WhatsApp queue completed.");
      return;
    }
    const member = queue[queueIndex++];
    const url = waUrl(member);
    if (!url) return openNext();
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) {
      queueIndex--;
      toast("Popup blocked. Allow pop-ups, then tap Open Next.");
      return;
    }
    if (window.RihulaAdmin?.logActivity) window.RihulaAdmin.logActivity("Opened WhatsApp chat for: " + member.name);
    const next = document.getElementById("waOpenNext");
    if (next) next.textContent = queueIndex < queue.length ? `💬 Open Next (${queue.length - queueIndex})` : "✓ Queue Done";
    toast(`Opened WhatsApp for ${member.name}. Tap Send in WhatsApp, then return and open the next member.`);
  }

  function selectAll(value) {
    document.querySelectorAll(".wa-check:not(:disabled)").forEach(x => x.checked = value);
    updateCount();
  }

  function toast(text) {
    const el = document.getElementById("waToast");
    if (!el) return;
    el.textContent = text;
    el.style.display = "block";
    clearTimeout(window.__waToastTimer);
    window.__waToastTimer = setTimeout(() => el.style.display = "none", 3500);
  }

  window.RihulaWhatsApp = { loadMembers, normalizeKenyanPhone };

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const admin = await window.RihulaAdmin.requireAdmin();
      if (!admin) return;
    } catch (e) { return; }

    document.getElementById("waSelectAll")?.addEventListener("change", e => selectAll(e.target.checked));
    document.getElementById("waClear")?.addEventListener("click", () => selectAll(false));
    document.getElementById("waOpenSelected")?.addEventListener("click", openSelected);
    document.getElementById("waOpenNext")?.addEventListener("click", openNext);
    document.getElementById("waRefresh")?.addEventListener("click", loadMembers);
    const templateSelect = document.getElementById("waTemplate");
    if (templateSelect) {
      templateSelect.addEventListener("change", function () {
        applyTemplate(this.value);
      });
      // Load the currently selected template on first page load too.
      applyTemplate(templateSelect.value);
    }
    ["waAmount", "waDate", "waPayment", "waMeeting"].forEach(id => {
      document.getElementById(id)?.addEventListener("input", () => {
        const current = document.getElementById("waTemplate")?.value;
        if (current && current !== "custom") {
          const msg = document.getElementById("waMessage");
          if (msg && TEMPLATES[current]) msg.value = TEMPLATES[current];
        }
      });
    });
    await loadMembers();
  });
})();
