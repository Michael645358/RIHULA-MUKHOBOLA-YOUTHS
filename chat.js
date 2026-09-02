
console.log("RIHULA Chat JS Loaded");
const user = JSON.parse(localStorage.getItem("loggedUser"));

if (!user) {
    window.location.href = "login.html";
}

const chatState = { messages: [] };

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function notify(message) {
    if (typeof showPopup === "function") showPopup(message);
    else if (typeof window.RihulaPopups !== "undefined") window.RihulaPopups.info(message);
}

function formatTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
}

function isMine(msg) {
    return String(msg.name || "").trim().toLowerCase() === String(user.name || "").trim().toLowerCase();
}

async function loadMessages() {
    try {
        await window.waitForRihulaDb();
    } catch (error) {
        notify("RIHULA database is still connecting. Please try again.");
        return;
    }

    const container = document.getElementById("chatMessages");
    if (!container) return;

    const { data, error } = await db
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Chat load error:", error);
        notify(error.message);
        return;
    }

    chatState.messages = data || [];
    container.innerHTML = "";

    if (!chatState.messages.length) {
        container.innerHTML = '<div class="chat-empty">No messages yet. Start the conversation.</div>';
        return;
    }

    chatState.messages.forEach(msg => {
        const mine = isMine(msg);
        const wrapper = document.createElement("div");
        wrapper.className = `chat-row ${mine ? "mine" : "theirs"}`;

        const photo = msg.photo_url
            ? `<img class="chat-avatar" src="${escapeHtml(msg.photo_url)}" alt="">`
            : `<div class="chat-avatar chat-avatar-fallback">${escapeHtml((msg.name || "?").charAt(0).toUpperCase())}</div>`;

        const actions = mine && msg.id != null ? `
            <div class="message-actions">
                <button type="button" onclick="copyMessage(${JSON.stringify(String(msg.message || ""))})">Copy</button>
                <button type="button" class="danger" onclick="deleteMessage(${JSON.stringify(String(msg.id))})">Delete</button>
            </div>` : "";

        wrapper.innerHTML = `
            ${photo}
            <div class="chat-bubble">
                <div class="chat-name">${escapeHtml(msg.name)}</div>
                <div class="chat-text">${escapeHtml(msg.message).replace(/\n/g, "<br>")}</div>
                <div class="chat-meta">${escapeHtml(formatTime(msg.created_at))}</div>
                ${actions}
            </div>`;

        container.appendChild(wrapper);
    });

    container.scrollTop = container.scrollHeight;
}

async function copyMessage(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            const area = document.createElement("textarea");
            area.value = text;
            area.style.position = "fixed";
            area.style.opacity = "0";
            document.body.appendChild(area);
            area.focus();
            area.select();
            document.execCommand("copy");
            area.remove();
        }
        notify("Message copied");
    } catch (error) {
        console.error(error);
        notify("Could not copy the message");
    }
}

async function deleteMessage(id) {
    try {
        await window.waitForRihulaDb();
    } catch (error) {
        notify("RIHULA database is still connecting. Please try again.");
        return;
    }

    if (!(await showConfirm("Delete this message? This cannot be undone.", { title: "Delete message", confirmText: "Delete", danger: true }))) return;

    const { error } = await db
        .from("messages")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Delete message error:", error);
        notify("Unable to delete message. Check your Supabase RLS policy.");
        return;
    }

    await loadMessages();
}

async function sendMessage() {
    try {
        await window.waitForRihulaDb();
    } catch (error) {
        notify("RIHULA database is still connecting. Please try again.");
        return;
    }

    const input = document.getElementById("chatMessage");
    const button = document.querySelector(".chatInput button");
    const message = input?.value.trim();

    if (!message) return;
    if (message.length > 2000) {
        notify("Message is too long. Maximum 2000 characters.");
        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent = "Sending...";
    }

    const { error } = await db
        .from("messages")
        .insert([{
            name: user.name,
            message,
            photo_url: user.photo_url || "",
            status: "✓"
        }]);

    if (error) {
        console.error("Send message error:", error);
        notify(error.message);
    } else {
        input.value = "";
        await loadMessages();
    }

    if (button) {
        button.disabled = false;
        button.textContent = "Send";
    }
}

async function loadOnlineMembers() {
    const box = document.getElementById("onlineMembers");
    if (!box) return;

    const { data, error } = await db
        .from("members")
        .select("name")
        .eq("online", true);

    if (error) {
        console.error("Online members error:", error);
        return;
    }

    box.innerHTML = "<b>🟢 Online Members</b><br>";
    if (!data || data.length === 0) {
        box.innerHTML += "No members online";
        return;
    }

    data.forEach(member => {
        box.insertAdjacentHTML("beforeend", `🟢 ${escapeHtml(member.name)}<br>`);
    });
}

window.copyMessage = copyMessage;
window.deleteMessage = deleteMessage;
window.sendMessage = sendMessage;

loadMessages();
loadOnlineMembers();
setInterval(loadMessages, 5000);
setInterval(loadOnlineMembers, 10000);

document.getElementById("chatMessage")?.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});
