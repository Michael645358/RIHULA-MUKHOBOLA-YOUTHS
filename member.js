/* =========================================================
   RIHULA GLOBAL LANGUAGE SYSTEM — English / Kiswahili
   This translates the member interface, not just the Profile screen.
   It is client-side only; no Supabase/database changes are needed.
   ========================================================= */
(function () {
    const STORAGE_KEY = "rihulaLanguage";
    const translations = {
        "en": {},
        "sw": {
            "Members Dashboard":"Dashibodi ya Wanachama",
            "Member account":"Akaunti ya mwanachama",
            "Logout":"Ondoka",
            "Today":"Leo",
            "This week":"Wiki hii",
            "This month":"Mwezi huu",
            "My contributions":"Michango yangu",
            "View Group Insights":"Angalia Taarifa za Kikundi",
            "RIHULA Savings":"Akiba ya RIHULA",
            "Group Goal":"Lengo la Kikundi",
            "Do more with your RIHULA account":"Fanya zaidi kupitia akaunti yako ya RIHULA",
            "Manage savings, members and association activities.":"Dhibiti akiba, wanachama na shughuli za chama.",
            "Contribute":"Changia",
            "My Savings history":"Historia ya Akiba Yangu",
            "Members":"Wanachama",
            "Leadership":"Uongozi",
            "Announcements":"Matangazo",
            "Community Chat":"Mazungumzo ya Jumuiya",
            "My Account":"Akaunti Yangu",
            "YOUR RIHULA SPACE":"NAFASI YAKO YA RIHULA",
            "Save. Grow. Belong.":"Okoa. Kua. Shiriki.",
            "Everything you need for your membership, savings and community life in one place.":"Kila unachohitaji kuhusu uanachama, akiba na maisha ya jumuiya katika sehemu moja.",
            "Quick tools":"Zana za Haraka",
            "Useful actions without leaving your dashboard.":"Vitendo muhimu bila kuondoka kwenye dashibodi yako.",
            "Statement":"Taarifa ya Akiba",
            "View my history":"Angalia historia yangu",
            "Track progress":"Fuatilia maendeleo",
            "Badges":"Beji",
            "See achievements":"Angalia mafanikio",
            "Updates":"Taarifa Mpya",
            "Latest news":"Habari za hivi karibuni",
            "My savings":"Akiba yangu",
            "Active member":"Mwanachama hai",
            "My goal":"Lengo langu",
            "RIHULA Updates 🔥":"Taarifa za RIHULA 🔥",
            "View all":"Angalia zote",
            "Latest announcement":"Tangazo la hivi karibuni",
            "Welcome to RIHULA Mukhobola":"Karibu RIHULA Mukhobola",
            "Stay updated with contributions, meetings and association news.":"Endelea kupata taarifa kuhusu michango, mikutano na habari za chama.",
            "My Achievements":"Mafanikio Yangu",
            "Loading achievements...":"Inapakia mafanikio...",
            "Keep saving to unlock achievements.":"Endelea kuweka akiba ili kufungua mafanikio.",
            "Notifications":"Arifa",
            "Back":"Rudi",
            "My Contribution History":"Historia ya Michango Yangu",
            "Latest Announcements":"Matangazo ya Hivi Karibuni",
            "My Profile":"Wasifu Wangu",
            "Upload Profile Photo":"Pakia Picha ya Wasifu",
            "Tap to choose a photo. It uploads automatically.":"Gusa kuchagua picha. Itapakiwa kiotomatiki.",
            "My Savings Goal":"Lengo Langu la Akiba",
            "Enter Goal Amount":"Weka Kiasi cha Lengo",
            "Save Goal":"Hifadhi Lengo",
            "Leadership Team":"Timu ya Uongozi",
            "Chairman":"Mwenyekiti",
            "Secretary":"Katibu",
            "Treasurer":"Mweka Hazina",
            "Organiser":"Mratibu",
            "Association Members":"Wanachama wa Chama",
            "Search member...":"Tafuta mwanachama...",
            "Contribution Days":"Siku za Michango",
            "Make Contribution":"Fanya Mchango",
            "Payment Instructions":"Maelekezo ya Malipo",
            "Community Chat":"Mazungumzo ya Jumuiya",
            "AI Assistant":"Msaidizi wa AI",
            "Ask me anything...":"Niulize chochote...",
            "Send":"Tuma",
            "Home":"Nyumbani",
            "Savings":"Akiba",
            "Chat":"Mazungumzo",
            "Profile":"Wasifu",
            "Delete Message":"Futa Ujumbe",
            "Copy Message":"Nakili Ujumbe",
            "Cancel":"Ghairi",
            "Close":"Funga",
            "No transactions found.":"Hakuna miamala iliyopatikana.",
            "No members found.":"Hakuna wanachama waliopatikana.",
            "No announcements yet.":"Hakuna matangazo bado.",
            "Loading...":"Inapakia...",
            "Language":"Lugha",
            "Choose your preferred language":"Chagua lugha unayopendelea",
            "Your language preference is saved automatically.":"Chaguo lako la lugha linahifadhiwa kiotomatiki.",
            "English":"Kiingereza",
            "Kiswahili":"Kiswahili",
            "Welcome back!":"Karibu tena!",
            "Good Morning":"Habari za Asubuhi",
            "Good Afternoon":"Habari za Mchana",
            "Good Evening":"Habari za Jioni",
            "Good Night":"Usiku Mwema"
        }
    };

    // Text nodes do not have .dataset. Keep original text safely in a WeakMap.
    // This prevents the language observer from throwing when it encounters
    // normal text nodes inside the page.
    const originalTextNodes = new WeakMap();

    function canonicalText(node) {
        if (!node || node.nodeType !== Node.TEXT_NODE) return "";

        if (!originalTextNodes.has(node)) {
            originalTextNodes.set(node, node.nodeValue || "");
        }

        return String(originalTextNodes.get(node) || "").trim();
    }

    function translateTextNode(node, lang) {
        const original = canonicalText(node);
        if (!original) return;
        const translated = (translations[lang] && translations[lang][original]) || original;
        if (node.nodeValue.trim() === original) {
            node.nodeValue = node.nodeValue.replace(original, translated);
        } else if (node.nodeValue.trim() === (translations.sw[original] || "__none__")) {
            node.nodeValue = node.nodeValue.replace(node.nodeValue.trim(), translated);
        }
    }

    function translateRoot(root, lang) {
        if (!root) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) {
            const n = walker.currentNode;
            if (n.parentElement && !["SCRIPT","STYLE","NOSCRIPT","OPTION"].includes(n.parentElement.tagName)) nodes.push(n);
        }
        nodes.forEach(n => translateTextNode(n, lang));

        root.querySelectorAll && root.querySelectorAll("input[placeholder], textarea[placeholder], [aria-label]").forEach(el => {
            ["placeholder","aria-label"].forEach(attr => {
                if (!el.hasAttribute(attr)) return;
                const original = el.dataset["rihulaOriginal"+attr.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())] || el.getAttribute(attr);
                const key = attr === "placeholder" ? "rihulaOriginalPlaceholder" : "rihulaOriginalAriaLabel";
                if (!el.dataset[key]) el.dataset[key] = original;
                const base = el.dataset[key];
                el.setAttribute(attr, (translations[lang] && translations[lang][base]) || base);
            });
        });
    }

    function apply(lang) {
        lang = lang === "sw" ? "sw" : "en";
        localStorage.setItem(STORAGE_KEY, lang);
        document.documentElement.lang = lang === "sw" ? "sw" : "en";
        translateRoot(document.body, lang);
        const select = document.getElementById("rihulaLanguageSelect");
        if (select) select.value = lang;
        const options = document.querySelectorAll("#rihulaLanguageSelect option");
        options.forEach(option => {
            if (option.value === "en") option.textContent = "🇬🇧 " + (lang === "sw" ? "Kiingereza" : "English");
            if (option.value === "sw") option.textContent = "🇰🇪 Kiswahili";
        });
        window.dispatchEvent(new CustomEvent("rihulaLanguageChanged", { detail: { language: lang } }));
    }

    function init() {
        const select = document.getElementById("rihulaLanguageSelect");
        if (select && !select.dataset.bound) {
            select.dataset.bound = "1";
            select.addEventListener("change", () => apply(select.value));
        }
        apply(localStorage.getItem(STORAGE_KEY) || "en");
        const observer = new MutationObserver(mutations => {
            const lang = localStorage.getItem(STORAGE_KEY) || "en";
            mutations.forEach(m => m.addedNodes.forEach(n => {
                if (n.nodeType === Node.ELEMENT_NODE || n.nodeType === Node.TEXT_NODE) translateRoot(n.nodeType === Node.TEXT_NODE ? n.parentElement : n, lang);
            }));
        });
        if (document.body) observer.observe(document.body, { childList:true, subtree:true });
    }

    window.RihulaLanguage = { apply, get: () => localStorage.getItem(STORAGE_KEY) || "en" };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once:true });
    else init();
})();

async function loadMemberData() {
    try {
        await window.waitForRihulaDb();
    } catch (error) {
        console.warn("RIHULA: Database not ready yet.", error.message);
        return;
    }


    const { data: authData, error: authError } = await db.auth.getUser();
    if (authError || !authData || !authData.user) {
        localStorage.removeItem("loggedUser");
        window.location.replace("login.html");
        return;
    }

    let user = null;
    const { data, error } = await db
        .from("members")
        .select("*")
        .eq("auth_id", authData.user.id)
        .single();

    if (error || !data || data.is_member !== true) {
        localStorage.removeItem("loggedUser");
        await db.auth.signOut();
        window.location.replace("login.html");
        return;
    }

    if (!error && data) {

        user = data;

        // Link this authenticated RIHULA member to OneSignal using the
        // same Supabase Auth UUID targeted by the push Edge Function.
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        if (typeof window.OneSignalDeferred.push === "function") {
            window.OneSignalDeferred.push(async function (OneSignal) {
                try {
                    await OneSignal.login(String(authData.user.id));
                    console.info("RIHULA: OneSignal member identity linked.");
                } catch (oneSignalError) {
                    console.warn(
                        "RIHULA: OneSignal member identity could not be linked.",
                        oneSignalError
                    );
                }
            });
        }

        localStorage.setItem(
            "loggedUser",
            JSON.stringify(user)
        );
        updateOnlineStatus(true);
    }

    const hour = new Date().getHours();

let greeting = "";

if (hour >= 5 && hour < 12) {
    greeting = "🌅 Good Morning";
} else if (hour >= 12 && hour < 17) {
    greeting = "☀️ Good Afternoon";
} else if (hour >= 17 && hour < 21) {
    greeting = "🌇 Good Evening";
} else {
    greeting = "🌙 Good Night";
}

const firstName = user.name.split(" ")[0];

document.getElementById("welcomeName").innerHTML = `
<div style="line-height:1.4;">
    <div style="font-size:30px;font-weight:bold;">
        ${greeting}, ${firstName} 👋
    </div>
    <div style="font-size:16px;opacity:0.9;">
        Welcome back!
    </div>
</div>
`;
    const images =
        document.querySelectorAll("#profileImage");

    images.forEach(img => {
        if (user.photo_url) {
            img.src = user.photo_url;
        }
    });

    if (
        document.getElementById("profileScreenImage") &&
        user.photo_url
    ) {
        document.getElementById("profileScreenImage").src =
            user.photo_url;
    }

    await loadContributionHistory(user.phone);
    await loadAnnouncements();
    await loadNotifications();
    await loadSavingsStats(user.phone);
    await loadCollectionPeriods();
    if (typeof window.loadMyRank === "function") await window.loadMyRank();
   await loadGroupGoal(); 
   await loadContributionDayTotals();
}

async function logout() {

    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    if (user) {

        const { error } = await db
            .from("members")
            .update({
                online: false,
                last_seen: new Date().toISOString()
            })
            .eq("phone", user.phone);

        if (error) {
            showPopup(error.message);
            return;
        }
    }

    try { await db.auth.signOut(); } catch (e) { console.warn("Supabase sign-out failed", e); }
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("rihulaMemberSession");
    window.location.replace("login.html");
}

loadMemberData();
updateUnreadCount();
updateOnlineStatus(true);
if (typeof window.loadMyRank === "function") window.loadMyRank();
showDashboard();
updateLastSeen();
loadOnlineMembers();

// Keep the personal savings card current after an admin records a contribution
// or withdrawal while the member remains on the dashboard.
setInterval(() => {
    const currentUser = JSON.parse(localStorage.getItem("loggedUser") || "null");
    if (currentUser && currentUser.phone) {
        loadSavingsStats(currentUser.phone);
    }
}, 15000);

window.addEventListener("pageshow", () => {
    const currentUser = JSON.parse(localStorage.getItem("loggedUser") || "null");
    if (currentUser && currentUser.phone) {
        loadSavingsStats(currentUser.phone);
    }
});

window.addEventListener("focus", () => {
    const currentUser = JSON.parse(localStorage.getItem("loggedUser") || "null");
    if (currentUser && currentUser.phone) {
        loadSavingsStats(currentUser.phone);
    }
});

setInterval(() => {
    updateLastSeen();
    loadOnlineMembers();
}, 30000); // Refresh every 30 seconds
function getRihulaMemberScreenIds() {
    return [
        "dashboardScreen",
        "historyScreen",
        "announcementsScreen",
        "profileScreen",
        "leadersScreen",
        "groupMembersScreen",
        "groupGoalScreen",
        "contributeScreen",
        "chatScreen",
        "aiScreen"
    ];
}

function hideAllMemberScreens() {
    getRihulaMemberScreenIds().forEach(function (id) {
        const el = document.getElementById(id);
        if (!el) return;

        el.classList.remove("active");
        el.hidden = true;
        el.style.display = "none";
    });
}

function openMemberScreen(id, addHistory = true) {
    const screen = document.getElementById(id);

    if (!screen) {
        console.warn("RIHULA: Member screen not found:", id);
        return;
    }

    /* Always close every other member screen first. */
    hideAllMemberScreens();

    /* Open only the selected screen. */
    screen.hidden = false;
    screen.style.display = "block";
    screen.classList.add("active");

    /* Keep Android/browser Back navigation working. */
    if (addHistory && !window.__rihulaHandlingPopState) {
        const state = { rihulaScreenId: id };
        if (!history.state || history.state.rihulaScreenId !== id) {
            history.pushState(state, "", "#" + id);
        }
    }

    window.scrollTo({ top: 0, behavior: "auto" });
}

function showHistory() {
    openMemberScreen("historyScreen");
}



async function showProfile() {
    openMemberScreen("profileScreen");

    let user = JSON.parse(localStorage.getItem("loggedUser"));
    if (!user) return;

    const { data } = await db.from("members").select("*").eq("phone", user.phone).single();
    if (data) {
        user = data;
        localStorage.setItem("loggedUser", JSON.stringify(user));
    }

    document.getElementById("passwordnName").innerText = user.name || "Member";
    document.getElementById("profileScreenPhone").innerText = user.phone || "";

    const status = document.getElementById("profileScreenStatus");
    if (status) {
        if (user.online) status.innerText = "🟢 Online";
        else if (user.last_seen) {
            const diffMinutes = Math.floor((new Date() - new Date(user.last_seen)) / 60000);
            if (diffMinutes < 1) status.innerText = "⏰ Last seen just now";
            else if (diffMinutes < 60) status.innerText = `⏰ Last seen ${diffMinutes} min ago`;
            else if (diffMinutes < 1440) status.innerText = `⏰ Last seen ${Math.floor(diffMinutes / 60)} hr ago`;
            else status.innerText = `⏰ Last seen ${Math.floor(diffMinutes / 1440)} day(s) ago`;
        } else status.innerText = "⚫ Offline";
    }

    const image = document.getElementById("profileScreenImage");
    if (image && user.photo_url) image.src = user.photo_url;
    const goal = document.getElementById("goalInput");
    if (goal) goal.value = user.goal || 5000;
}

function showLeaders() {
    openMemberScreen("leadersScreen");
}

function showGroupMembers() {
    openMemberScreen("groupMembersScreen");
    loadGroupMembers();
}

async function loadGroupMembers() {

    const { data, error } = await db
        .from("members")
        .select("name, phone, photo_url, online, role")
data.sort((a, b) => {

    const leaderOrder = {
        "Chairperson": 1,
        "Secretary": 2,
        "Treasurer": 3
    };

    const aOrder = leaderOrder[a.role] || 99;
    const bOrder = leaderOrder[b.role] || 99;

    if (aOrder !== bOrder) {
        return aOrder - bOrder;
    }

    return a.name.localeCompare(b.name);

});
    const container = document.getElementById("membersContainer");

    if (error) {
    console.log(error);
    container.innerHTML = `<p>${error.message}</p>`;
    return;
}

    if (!data || data.length === 0) {
        container.innerHTML = "<p>No members found.</p>";
        return;
    }

    container.innerHTML = "";

    data.forEach(member => {

        container.innerHTML += `
            <div class="card">
                <img src="${member.photo_url || 'images/logo.jpg'}"
                     class="leader-photo">

                <h3>${member.name}</h3>
                
                <p class="member-position">
${member.role || "👤 Member"}
</p>

<p>
    ${member.online ? "🟢 Online" : "⚫ Offline"}
</p>

<div class="leader-buttons">

    <a href="tel:${member.phone}" class="leader-btn">
    📞 Call
</a>

<a href="https://wa.me/254${member.phone.toString().replace(/^0/, "")}" class="leader-btn">
    💬 WhatsApp
</a>
    
    

</div>
        `;
    });
}
async function loadGroupGoal() {

    try {

        // Get group goal from settings
        const { data: settings, error: settingsError } = await db
            .from("settings")
            .select("group_goal")
            .eq("id", 1)
            .single();

        if (settingsError) {
            console.error("Group goal error:", settingsError);
            return;
        }

        const goal = Number(settings.group_goal || 0);

        // Get all contributions
        const { data: contributions, error: contributionError } =
            await db
                .from("contributions")
                .select("amount");

        if (contributionError) {
            console.error(
                "Contribution error:",
                contributionError
            );
            return;
        }

        // Calculate total collected
        let collected = 0;

        (contributions || []).forEach(item => {
            collected += Number(item.amount || 0);
        });

        // Calculate remaining
        const remaining = Math.max(goal - collected, 0);

        // Calculate percentage
        let percent = 0;

        if (goal > 0) {
            percent = Math.round(
                (collected / goal) * 100
            );
        }

        // Don't allow progress to visually exceed 100%
        const progressPercent = Math.min(percent, 100);

        // =========================
        // DASHBOARD GROUP GOAL
        // =========================

        const groupGoal =
            document.getElementById("groupGoal");

        if (groupGoal) {
            groupGoal.innerText =
                "KSh " + goal.toLocaleString();
        }

        const groupCollected =
            document.getElementById("groupCollected");

        if (groupCollected) {
            groupCollected.innerText =
                "KSh " + collected.toLocaleString();
        }

        const groupRemaining =
            document.getElementById("groupRemaining");

        if (groupRemaining) {
            groupRemaining.innerText =
                "KSh " + remaining.toLocaleString();
        }

        const groupPercent =
            document.getElementById("groupPercent");

        if (groupPercent) {
            groupPercent.innerText =
                percent + "% Complete";
        }

        const groupProgress =
            document.getElementById("groupProgress");

        if (groupProgress) {
            groupProgress.style.width =
                progressPercent + "%";
        }


        // =========================
        // GROUP GOAL SCREEN
        // =========================

        const goalAmount =
            document.getElementById("groupGoalAmount");

        if (goalAmount) {
            goalAmount.innerText =
                "KSh " + goal.toLocaleString();
        }

        const goalCollected =
            document.getElementById("groupGoalCollected");

        if (goalCollected) {
            goalCollected.innerText =
                "KSh " + collected.toLocaleString();
        }

        const goalRemaining =
            document.getElementById("groupGoalRemaining");

        if (goalRemaining) {
            goalRemaining.innerText =
                "KSh " + remaining.toLocaleString();
        }

        const goalPercent =
            document.getElementById("groupGoalPercent");

        if (goalPercent) {
            goalPercent.innerText =
                percent + "%";
        }

        const goalProgress =
            document.getElementById("groupGoalProgress");

        if (goalProgress) {
            goalProgress.style.width =
                progressPercent + "%";
        }

        const goalComplete =
            document.getElementById("groupGoalComplete");

        if (goalComplete) {
            goalComplete.innerText =
                percent + "% Complete";
        }

    } catch (error) {

        console.error(
            "Group Goal Error:",
            error
        );

    }
}
function showContribute() {
    openMemberScreen("contributeScreen");
}


function showGroupGoal() {
    openMemberScreen("groupGoalScreen");
}


function getContributionCollectionDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const day = date.getDay(); // Sun=0 ... Sat=6
    let daysBack;

    // Saturday collection covers Saturday, Sunday, Monday and Tuesday.
    if (day === 6 || day === 0 || day === 1 || day === 2) {
        daysBack = day === 6 ? 0 : day + 1;
    } else {
        // Wednesday collection covers Wednesday, Thursday and Friday.
        daysBack = day - 3;
    }

    const collectionDate = new Date(date);
    collectionDate.setDate(collectionDate.getDate() - daysBack);
    collectionDate.setHours(0, 0, 0, 0);
    return collectionDate;
}

function formatContributionCollectionDate(value) {
    const date = getContributionCollectionDate(value);
    return date
        ? date.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "2-digit",
            month: "short",
            year: "numeric"
        })
        : "";
}

async function loadContributionHistory(phone) {

    try {

        const { data: contributions, error: contributionError } =
            await db
                .from("contributions")
                .select("amount, created_at")
                .eq("member_phone", String(phone));

        if (contributionError) {
            console.error("Contribution history error:", contributionError);
            return;
        }

        const { data: withdrawals, error: withdrawalError } =
            await db
                .from("withdrawals")
                .select("amount, reason, created_at")
                .eq("member_phone", String(phone));

        if (withdrawalError) {
            console.error("Withdrawal history error:", withdrawalError);
            return;
        }

        const history = [];

        // Keep every contribution amount, but display it under its official
        // collection day (Sat for Sat-Tue, Wed for Wed-Fri).
        (contributions || []).forEach(item => {
            history.push({
                type: "contribution",
                amount: Number(item.amount || 0),
                reason: "Contribution",
                created_at: item.created_at,
                collection_date: getContributionCollectionDate(item.created_at)
            });
        });

        (withdrawals || []).forEach(item => {
            history.push({
                type: "withdrawal",
                amount: Number(item.amount || 0),
                reason: item.reason || "Savings withdrawal",
                created_at: item.created_at,
                collection_date: null
            });
        });

        history.sort((a, b) => {
            const aDate = a.collection_date || new Date(a.created_at);
            const bDate = b.collection_date || new Date(b.created_at);
            return bDate - aDate;
        });

        const container = document.getElementById("historyOnlyContainer");
        if (!container) return;

        if (history.length === 0) {
            container.innerHTML = "<p>No savings activity yet.</p>";
            return;
        }

        container.innerHTML = "";

        history.forEach(item => {
            const date = item.type === "contribution"
                ? formatContributionCollectionDate(item.created_at)
                : (item.created_at
                    ? new Date(item.created_at).toLocaleDateString("en-GB")
                    : "");

            if (item.type === "withdrawal") {
                container.innerHTML += `
                    <div class="card">
                        <h3 style="color:#c0392b;">
                            💸 -KSh ${item.amount.toLocaleString()}
                        </h3>
                        <p>${item.reason}</p>
                        <small>${date}</small>
                    </div>
                `;
            } else {
                container.innerHTML += `
                    <div class="card">
                        <h3 style="color:#087f4f;">
                            💰 +KSh ${item.amount.toLocaleString()}
                        </h3>
                        <p>Contribution • Collection day</p>
                        <small>${date}</small>
                    </div>
                `;
            }
        });

    } catch (error) {
        console.error("Savings history error:", error);
    }
}
async function loadSavingsStats(phone) {

    try {
        const requestedPhone = String(phone || "").trim();

        if (!requestedPhone) return;

        let contributions = 0;
        let withdrawals = 0;
        let usedRpc = false;

        // Primary source: secure member finance function.
        const { data, error } = await db.rpc(
            "get_member_finance",
            { p_phone: requestedPhone }
        );

        if (!error) {
            const row = Array.isArray(data) ? (data[0] || {}) : (data || {});
            contributions = Number(row.contributions || 0);
            withdrawals = Number(row.withdrawals || 0);
            usedRpc = true;
        } else {
            // Some deployments do not yet have the RPC in PostgREST's schema
            // cache. That is a compatibility condition, not a member-facing
            // JavaScript error, so use the personal-row fallback quietly.
            const rpcMissing =
                error &&
                (error.code === "PGRST202" ||
                 /schema cache/i.test(error.message || "") ||
                 /get_member_finance/i.test(error.message || ""));

            if (!rpcMissing) {
                console.warn("get_member_finance failed; using personal row fallback:", error.message);
            }

            // Fallback for projects where the RPC has not yet been deployed.
            const [cResult, wResult] = await Promise.all([
                db.from("contributions")
                    .select("member_phone, amount")
                    .eq("member_phone", requestedPhone),
                db.from("withdrawals")
                    .select("member_phone, amount")
                    .eq("member_phone", requestedPhone)
            ]);

            if (cResult.error) throw cResult.error;
            if (wResult.error) throw wResult.error;

            contributions = (cResult.data || []).reduce(
                (sum, row) => sum + Number(row.amount || 0),
                0
            );

            withdrawals = (wResult.data || []).reduce(
                (sum, row) => sum + Number(row.amount || 0),
                0
            );
        }

        const currentSavings = Math.max(
            contributions - withdrawals,
            0
        );

        const mySavings = document.getElementById("mySavings");

        if (mySavings) {
            mySavings.textContent =
                "KSh " + currentSavings.toLocaleString("en-KE");
        }

        const user =
            JSON.parse(localStorage.getItem("loggedUser") || "{}");

        const goal = Number(user.goal || 5000);

        const percent = goal > 0
            ? Math.min(
                100,
                Math.round((currentSavings / goal) * 100)
            )
            : 0;

        const goalAmount = document.getElementById("goalAmount");
        if (goalAmount) {
            goalAmount.textContent =
                "KSh " + currentSavings.toLocaleString("en-KE") +
                " / KSh " + goal.toLocaleString("en-KE");
        }

        const progressText = document.getElementById("progressText");
        if (progressText) {
            progressText.textContent = percent + "%";
        }

        const progressFill = document.getElementById("progressFill");
        if (progressFill) {
            progressFill.style.width = percent + "%";
        }

        console.log("RIHULA PERSONAL SAVINGS", {
            phone: requestedPhone,
            contributions,
            withdrawals,
            savings: currentSavings,
            source: usedRpc ? "get_member_finance" : "fallback"
        });

    } catch (error) {
        console.error("Personal savings update error:", error);
        // Keep the last valid value on screen instead of replacing it with 0.
    }
}

async function loadCollectionPeriods() {
    try {
        const user = JSON.parse(
            localStorage.getItem("loggedUser") || "null"
        );

        const todayEl =
            document.getElementById("memberCollectedToday");

        const weekEl =
            document.getElementById("memberCollectedWeek");

        const monthEl =
            document.getElementById("memberCollectedMonth");

        // This card is PERSONAL only.
        // Never use group totals here.
        if (!user || !user.phone) {
            if (todayEl) todayEl.textContent = "KSh 0";
            if (weekEl) weekEl.textContent = "KSh 0";
            if (monthEl) monthEl.textContent = "KSh 0";
            return;
        }

        const normalizePhone = phone => {
            let p = String(phone || "").replace(/\D/g, "");

            if (p.startsWith("254")) {
                p = "0" + p.substring(3);
            }

            return p;
        };

        const myPhone = normalizePhone(user.phone);

        // Load contribution rows and keep ONLY this member's rows.
        const { data, error } = await db
            .from("contributions")
            .select("member_phone, amount, created_at");

        if (error) {
            console.error(
                "Personal contribution periods error:",
                error
            );

            if (todayEl) todayEl.textContent = "KSh 0";
            if (weekEl) weekEl.textContent = "KSh 0";
            if (monthEl) monthEl.textContent = "KSh 0";
            return;
        }

        const mine = (data || []).filter(row =>
            normalizePhone(row.member_phone) === myPhone
        );

        const now = new Date();

        const startOfDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        const startOfWeek = new Date(startOfDay);
        const daysFromMonday =
            (startOfDay.getDay() + 6) % 7;

        startOfWeek.setDate(
            startOfWeek.getDate() - daysFromMonday
        );

        const startOfMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

        let today = 0;
        let week = 0;
        let month = 0;

        mine.forEach(row => {
            const date = new Date(row.created_at);
            const amount = Number(row.amount || 0);

            if (Number.isNaN(date.getTime())) return;

            if (date >= startOfDay) today += amount;
            if (date >= startOfWeek) week += amount;
            if (date >= startOfMonth) month += amount;
        });

        const format = value =>
            "KSh " + Number(value || 0).toLocaleString("en-KE");

        if (todayEl) todayEl.textContent = format(today);
        if (weekEl) weekEl.textContent = format(week);
        if (monthEl) monthEl.textContent = format(month);

        console.log("RIHULA PERSONAL CONTRIBUTIONS", {
            memberPhone: user.phone,
            today,
            week,
            month,
            records: mine.length
        });

    } catch (error) {
        console.error(
            "Personal contribution periods failed:",
            error
        );
    }
}

function togglePasswordVisibility() {

    const fields = [
        "currentPassword",
        "newPassword",
        "confirmPassword"
    ];

    fields.forEach(id => {

        const input = document.getElementById(id);

        input.type =
            input.type === "password"
            ? "text"
            : "password";

    });

}
async function loadAnnouncements() {

    const { data, error } = await db
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) return;

    const container =
document.getElementById("announcementsOnlyContainer");

    if (!container) return;

    container.innerHTML = "";

    if (!data || data.length === 0) {
        container.innerHTML = "<p>No announcements available.</p>";
        return;
    }

    data.forEach(item => {

        container.innerHTML += `
        <div class="card">
            <h3>${item.title}</h3>
            <p>${item.message}</p>
        </div>
        `;
    });

    const latest = data[0];
    const featuredTitle = document.getElementById("dashboardAnnouncementTitle");
    const featuredMessage = document.getElementById("dashboardAnnouncementMessage");

    if (latest) {
        if (featuredTitle) featuredTitle.innerText = latest.title || "Latest announcement";
        if (featuredMessage) featuredMessage.innerText = latest.message || "Check the announcements section for more information.";
    }
}
async function uploadProfilePhoto() {

    const user =
        JSON.parse(localStorage.getItem("loggedUser") || "null");

    const input =
        document.getElementById("photoUpload");

    const button =
        document.getElementById("uploadPhotoButton");


    // =========================
    // CHECK USER + FILE
    // =========================

    if (
        !user ||
        !input ||
        !input.files ||
        !input.files[0]
    ) {
        showPopup(
            "Please choose a photo first.",
            "warning"
        );
        return;
    }


    const file = input.files[0];


    // =========================
    // CHECK IMAGE TYPE
    // =========================

    if (!file.type.startsWith("image/")) {

        showPopup(
            "Please select an image.",
            "warning"
        );

        input.value = "";
        return;
    }


    // =========================
    // MAXIMUM 5MB
    // =========================

    if (file.size > 5 * 1024 * 1024) {

        showPopup(
            "Photo must be less than 5MB.",
            "warning"
        );

        input.value = "";
        return;
    }


    // =========================
    // BUTTON
    // =========================

    if (button) {

        button.disabled = true;

        button.innerText =
            "⏳ Uploading...";
    }


    try {

        // =================================
        // GET REAL SUPABASE AUTH USER
        // =================================

        const {
            data: {
                user: authUser
            },
            error: authError
        } = await db.auth.getUser();


        if (authError || !authUser) {

            console.error(
                "SUPABASE AUTH ERROR:",
                authError
            );

            showPopup(
                "Your login session has expired. Please log in again.",
                "error"
            );

            return;
        }


        // =================================
        // GET RIHULA MEMBER ID
        // =================================

        const memberId =
            user.id ||
            user.member_id ||
            user.memberId;


        if (!memberId) {

            console.error(
                "RIHULA MEMBER DATA:",
                user
            );

            showPopup(
                "Your member account could not be identified.",
                "error"
            );

            return;
        }


        // =================================
        // SAFE FILE EXTENSION
        // =================================

        let extension = "jpg";

        if (file.type === "image/png") {

            extension = "png";

        } else if (file.type === "image/webp") {

            extension = "webp";

        } else if (
            file.type === "image/jpeg" ||
            file.type === "image/jpg"
        ) {

            extension = "jpg";
        }


        // =================================
        // UNIQUE STORAGE PATH
        // =================================

        const fileName =
            `members/${memberId}/${Date.now()}.${extension}`;


        console.log(
            "================================="
        );

        console.log(
            "RIHULA PROFILE PHOTO UPLOAD"
        );

        console.log(
            "Supabase Auth ID:",
            authUser.id
        );

        console.log(
            "RIHULA Member ID:",
            memberId
        );

        console.log(
            "File:",
            file.name
        );

        console.log(
            "Type:",
            file.type
        );

        console.log(
            "Size:",
            file.size
        );

        console.log(
            "Storage path:",
            fileName
        );

        console.log(
            "================================="
        );


        // =================================
        // UPLOAD TO SUPABASE STORAGE
        // =================================

        const {
            data: uploadData,
            error: uploadError
        } = await db.storage
            .from("profile-pictures")
            .upload(
                fileName,
                file,
                {
                    cacheControl: "3600",

                    contentType: file.type,

                    upsert: true
                }
            );


        if (uploadError) {

            console.error(
                "================================="
            );

            console.error(
                "PROFILE PHOTO STORAGE ERROR"
            );

            console.error(
                "Message:",
                uploadError.message
            );

            console.error(
                "Error:",
                uploadError.error
            );

            console.error(
                "Status:",
                uploadError.statusCode
            );

            console.error(
                "Full error:",
                uploadError
            );

            console.error(
                "================================="
            );


            showPopup(
                uploadError.message ||
                "Photo upload failed. Please check Supabase Storage permissions.",
                "error"
            );

            return;
        }


        console.log(
            "PHOTO UPLOAD SUCCESS:",
            uploadData
        );


        // =================================
        // GET PUBLIC URL
        // =================================

        const {
            data: publicData
        } = db.storage
            .from("profile-pictures")
            .getPublicUrl(fileName);


        const photoUrl =
            publicData?.publicUrl;


        if (!photoUrl) {

            console.error(
                "Could not create public URL."
            );

            showPopup(
                "Photo uploaded but URL could not be created.",
                "error"
            );

            return;
        }


        console.log(
            "PROFILE PHOTO URL:",
            photoUrl
        );


        // =================================
        // SAVE URL IN MEMBERS TABLE
        // =================================

        const {
            error: updateError
        } = await db
            .from("members")
            .update({
                photo_url: photoUrl
            })
            .eq(
                "id",
                memberId
            );


        if (updateError) {

            console.error(
                "PROFILE DATABASE ERROR:",
                updateError
            );

            showPopup(
                "Photo uploaded, but could not save it to your profile.",
                "error"
            );

            return;
        }


        // =================================
        // UPDATE LOCAL USER
        // =================================

        user.photo_url =
            photoUrl;

        localStorage.setItem(
            "loggedUser",
            JSON.stringify(user)
        );


        // =================================
        // UPDATE PROFILE IMAGE
        // =================================

        const profileImage =
            document.getElementById(
                "profileImage"
            );

        const profileScreenImage =
            document.getElementById(
                "profileScreenImage"
            );


        // Cache-busting so the new photo
        // appears immediately

        const displayUrl =
            photoUrl +
            "?t=" +
            Date.now();


        if (profileImage) {

            profileImage.src =
                displayUrl;
        }


        if (profileScreenImage) {

            profileScreenImage.src =
                displayUrl;
        }


        // =================================
        // CLEAR INPUT
        // =================================

        input.value = "";


        // =================================
        // SUCCESS
        // =================================

        showPopup(
            "Profile photo updated successfully!",
            "success"
        );


    } catch (error) {

        console.error(
            "================================="
        );

        console.error(
            "PROFILE PHOTO ERROR:",
            error
        );

        console.error(
            "Message:",
            error?.message
        );

        console.error(
            "================================="
        );


        showPopup(
            error?.message ||
            "Something went wrong while uploading the photo.",
            "error"
        );


    } finally {

        if (button) {

            button.disabled = false;

            button.innerText =
                "📷 Upload Profile Photo";
        }
    }
}
async function saveGoal() {

    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    const goal =
        Number(document.getElementById("goalInput").value);

    if (!goal || goal <= 0) {
        showPopup("Enter a valid goal amount");
        return;
    }

    const { error } = await db
        .from("members")
        .update({ goal: goal })
        .eq("phone", user.phone);

    if (error) {
        showPopup(error.message);
        return;
    }

    user.goal = goal;

    localStorage.setItem(
        "loggedUser",
        JSON.stringify(user)
    );

    showPopup("Goal updated successfully");

    loadSavingsStats(user.phone);
}
function scrollToBottom() {
    const container =
        document.getElementById("chatMessages");

    if (container) {
        container.scrollTop =
            container.scrollHeight;
    }
}

function showAI() {
    openMemberScreen("aiScreen");
}


function showDashboard() {
    openMemberScreen("dashboardScreen", false);
}

function showChat() {
    openMemberScreen("chatScreen");
    const unread = document.getElementById("unreadBadge");
    if (unread) unread.style.display = "none";
    loadMessages();
    loadOnlineMembers();
    scrollToBottom();
}

async function sendMessage() {

    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    const message =
        document.getElementById("chatMessage").value;

    if (!message) {
        showPopup("Type a message");
        return;
    }

    const { error } = await db
        .from("messages")
        .insert([
         {
    name: user.name,
    message: message,
    status: "✓",
    photo_url: user.photo_url || ""
}

        ]);

    if (error) {
        showPopup(error.message);
        return;
    }

    document.getElementById("chatMessage").value = "";

    loadMessages();
}
let mediaRecorder;
let audioChunks = [];
async function startRecording() {

    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

        mediaRecorder = new MediaRecorder(stream);

        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

    mediaRecorder.onstop = async () => {

    const audioBlob = new Blob(audioChunks, {
        type: "audio/webm"
    });

    const fileName = `voice_${Date.now()}.webm`;

const { error } = await db.storage
    .from("voice-notes")
    .upload(fileName, audioBlob);
    
    if (error) {
        showPopup("Upload failed");
        console.error(error);
        return;
    }
const { data: publicUrlData } = db.storage
    .from("voice-notes")
    .getPublicUrl(fileName);

const audioUrl = publicUrlData.publicUrl;
    console.log("Voice URL:", audioUrl);

    const user = JSON.parse(localStorage.getItem("loggedUser"));

const { error: msgError } = await db
    .from("messages")
    .insert([{
        name: user.name,
        message: "",
        audio_url: audioUrl,
        status: "✓",
        photo_url: user.photo_url
    }]);

if (msgError) {
    console.error(msgError);
    showPopup("Failed to send voice message.");
} else {
    showPopup("Voice message sent.");
}
};

        mediaRecorder.start();

        const btn = document.getElementById("recordBtn");
btn.innerHTML = "🔴 Recording";
btn.style.background = "#dc2626";

        document.getElementById("recordBtn").onclick =
            stopRecording;

    } catch (err) {

        showPopup("Microphone permission denied");

    }
}

function stopRecording() {

    mediaRecorder.stop();

    const btn = document.getElementById("recordBtn");
btn.innerHTML = "🎤";
btn.style.background = "#15803d";

    document.getElementById("recordBtn").onclick =
        startRecording;
}
async function loadMessages() {
const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    await db
        .from("messages")
        .update({ status: "read" })
        .neq("name", user.name)
        .eq("status", "✓");

updateUnreadCount();

    const { data, error } = await db
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        showPopup(error.message);
        return;
    }

    const container =
        document.getElementById("chatMessages");

    if (!container) return;

    container.innerHTML = "";

    data.forEach(item => {

        const mine =
            item.name === user.name;

        const time =
            new Date(item.created_at)
            .toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });


        container.innerHTML += `
        <div class="chat-message ${mine ? 'my-msg' : 'other-msg'}"
     onmousedown="startHold(${item.id}, decodeURIComponent('${encodeURIComponent(item.message || "")}'))"
     onmouseup="cancelHold()"
     ontouchstart="startHold(${item.id}, decodeURIComponent('${encodeURIComponent(item.message || "")}'))"
     ontouchend="cancelHold()">

            <div class="chat-header">
    <img src="${item.photo_url || 'images/logo.jpg'}" class="chat-avatar">
    <h4>${item.name}</h4>
</div>

            ${item.audio_url
    ? `<audio controls style="width:100%;">
           <source  src="${item.audio_url}"
           type="audio/webm">
           Your browser does not support audio.
       </audio>`
    : `<p>${item.message}</p>`
}


            <div class="chat-footer">
                <span class="chat-time">${time}</span>
                ${mine ? `
                <span class="chat-status">
                    ${item.status === "read" ? "✓✓" : "✓"}
                </span>
                ` : ''}
            </div>

        </div>
        `;
    });

    container.scrollTop =
        container.scrollHeight;
}
/*
setInterval(() => {

    updateUnreadCount();

    const chatScreen =
        document.getElementById("chatScreen");

        if (
    chatScreen &&
    chatScreen.style.display === "block"
) {
    loadMessages();
    loadOnlineMembers();
}

}, 5000);
*/
async function loadNotifications() {

    const { data, error } = await db
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) return;

    const container =
        document.getElementById("notificationsContainer");

    if (!container) return;

    container.innerHTML = "";

    if (!data || data.length === 0) {
        container.innerHTML =
            "<p>No notifications available.</p>";
        return;
    }

    data.forEach(item => {
    container.innerHTML += `
    <div class="card">
        <h3>${item.title}</h3>
        <p>${item.message}</p>

        <button
            class="btn delete-btn"
            onclick="deleteNotification(${item.id})">
            🗑 Delete
        </button>

    </div>
    `;
});
}
async function updateUnreadCount() {
    try {
        await window.waitForRihulaDb();
    } catch (error) {
        console.warn("RIHULA: Database not ready yet.", error.message);
        return;
    }


    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    const { data, error } = await db
        .from("messages")
        .select("*")
        .neq("name", user.name)
        .eq("status", "✓");

    if (error) return;

    const badge =
        document.getElementById("unreadBadge");
    if (!badge) return;

    const count = data ? data.length : 0;

    badge.innerText = count;

    badge.style.display =
        count > 0 ? "flex" : "none";
}
async function updateOnlineStatus(isOnline) {
    try {
        await window.waitForRihulaDb();
    } catch (error) {
        console.warn("RIHULA: Database not ready yet.", error.message);
        return;
    }


    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    if (!user) return;

    await db
        .from("members")
        .update({
            online: isOnline,
            last_seen: new Date().toISOString()
        })
        .eq("phone", user.phone);
}
async function loadOnlineMembers() {
    try {
        await window.waitForRihulaDb();
    } catch (error) {
        console.warn("RIHULA: Database not ready yet.", error.message);
        return;
    }


    const fiveMinutesAgo =
new Date(Date.now() - 5 * 60 * 1000).toISOString();

const { data, error } = await db
    .from("members")
    .select("name, photo_url, last_seen");

    if (error) return;

    const container =
        document.getElementById("onlineMembers");

    if (!container) return;

    container.innerHTML = "";

    data.forEach(member => {

    let status = "⚫ Offline";

if (member.last_seen) {

    const diffMinutes = Math.floor(
        (Date.now() - new Date(member.last_seen)) / 60000
    );

    if (diffMinutes < 5) {
        status = "🟢 Online";
    } else if (diffMinutes < 60) {
        status = ` ${diffMinutes} min ago`;
    } else if (diffMinutes < 1440) {
        status = `${Math.floor(diffMinutes / 60)} hr ago`;
    } else {
        status = `${Math.floor(diffMinutes / 1440)} day(s) ago`;
    }
}

const firstName = member.name.split(" ")[0];

container.innerHTML += `
<div class="online-user"
     onclick="showMemberStatus(
        '${member.name}',
        '${member.photo_url || "images/logo.jpg"}',
        '${member.last_seen || ""}'
     )">

    <div style="position:relative;display:inline-block;">
        <img src="${member.photo_url || 'images/logo.jpg'}"
             class="online-avatar">

        ${status === "🟢 Online"
        ? `<span style="
            position:absolute;
            bottom:2px;
            right:2px;
            width:12px;
            height:12px;
            background:#22c55e;
            border:2px solid white;
            border-radius:50%;
        "></span>`
        : ""}
    </div>

    <small>${firstName}</small>

</div>
    <div>
    <strong>${member.name.split(" ")[0]}</strong> <br>
        <small>${status === "🟢 Online" ? "Online" : status}</small>
    </div>

    </div>
</div>
`;
});
}
async function loadOfflineMembers() {

    const { data, error } = await db
        .from("members")
        .select("name, photo_url, last_seen")
        .eq("online", false);

    if (error) return;

    console.log(data);
}
async function deleteMessage(id) {

    const confirmDelete = await showConfirm("Delete this message? This cannot be undone.", { title: "Delete message", confirmText: "Delete", danger: true });

    if (!confirmDelete) return;

    const { error } = await db
        .from("messages")
        .delete()
        .eq("id", id);

    if (error) {
        showPopup(error.message);
        return;
    }

    loadMessages();
}
async function updateLastSeen() {
    try {
        await window.waitForRihulaDb();
    } catch (error) {
        console.warn("RIHULA: Database not ready yet.", error.message);
        return;
    }


    const user = JSON.parse(localStorage.getItem("loggedUser"));

    if (!user) return;

    await db
        .from("members")
        .update({
            last_seen: new Date().toISOString()
        })
        .eq("phone", user.phone);
}
function showMemberStatus(name, photo, lastSeen) {

    let status = "⚫ Offline";

    if (lastSeen) {

        const diffMinutes = Math.floor(
            (Date.now() - new Date(lastSeen)) / 60000
        );

        if (diffMinutes < 5) {
            status = "🟢 Online";
        } else if (diffMinutes < 60) {
            status = `⏰ Last seen ${diffMinutes} min ago`;
        } else if (diffMinutes < 1440) {
            status = `⏰ Last seen ${Math.floor(diffMinutes / 60)} hr ago`;
        } else {
            status = `⏰ Last seen ${Math.floor(diffMinutes / 1440)} day(s) ago`;
        }
    }

    document.getElementById("popupPhoto").src = photo;
    document.getElementById("popupName").innerText = name;
    document.getElementById("popupStatus").innerText = status;

    document.getElementById("memberStatusPopup").style.display = "flex";
}

function closeMemberStatus() {
    document.getElementById("memberStatusPopup").style.display = "none";

    document.getElementById("memberStatusPopup").onclick = function(e) {
    if (e.target === this) {
        closeMemberStatus();
    }
};
}

let selectedMessageId = null;
let selectedMessageText = "";

function showMessageMenu(id, text) {
    selectedMessageId = id;
    selectedMessageText = text || "";
    const menu = document.getElementById("messageMenu");
    if (!menu) return;
    menu.style.display = "block";
    menu.setAttribute("role", "menu");
}

function closeMessageMenu() {

    document.getElementById("messageMenu")
        .style.display = "none";
}

async function deleteSelectedMessage() {

    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    const { data, error } = await db
        .from("messages")
        .select("*")
        .eq("id", selectedMessageId)
        .single();

    if (error) {
        showPopup(error.message);
        return;
    }

    if (data.name !== user.name) {
        showPopup("You can only delete your own messages");
        return;
    }

    const { error: deleteError } = await db
        .from("messages")
        .delete()
        .eq("id", selectedMessageId);

    if (deleteError) {
        showPopup(deleteError.message);
        return;
    }

    closeMessageMenu();
    loadMessages();
}

async function copySelectedMessage() {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(selectedMessageText || "");
        } else {
            const area = document.createElement("textarea");
            area.value = selectedMessageText || "";
            area.style.position = "fixed";
            area.style.opacity = "0";
            document.body.appendChild(area);
            area.select();
            document.execCommand("copy");
            area.remove();
        }
        showPopup("Message copied", "success");
    } catch (error) {
        console.error(error);
        showPopup("Could not copy this message.", "error");
    }
    closeMessageMenu();
}
let holdTimer;

function startHold(id, text) {

    holdTimer = setTimeout(() => {
        showMessageMenu(id, text);
    }, 800); // hold for 0.8 seconds
}
function cancelHold() {

    clearTimeout(holdTimer);
}

async function showAnnouncements() {
    openMemberScreen("announcementsScreen");
    const container = document.getElementById("announcementsOnlyContainer");
    if (!container) return;
    const { data, error } = await db.from("announcements").select("*").order("created_at", { ascending: false });
    if (error) {
        container.innerHTML = "<p>Failed to load announcements.</p>";
        return;
    }
    container.innerHTML = (data || []).map(item => `
        <article class="announcement">
            <span class="date-badge">${new Date(item.created_at).toLocaleDateString()}</span>
            <h3>${item.title || "Announcement"}</h3>
            <p>${item.message || ""}</p>
        </article>`).join("") || "<p>No announcements yet.</p>";
}

async function deleteNotification(id) {

    const ok = await showConfirm("Delete this notification? This cannot be undone.", { title: "Delete notification", confirmText: "Delete", danger: true, icon: "🗑" });

    if (!ok) return;

    const { error } = await db
        .from("notifications")
        .delete()
        .eq("id", id);

    if (error) {
        showPopup(error.message);
        return;
    }

    loadNotifications();
}

// CONTRIBUTION REMINDER

async function checkContributionReminder() {
console.log("Reminder function running");
    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    if (!user) return;

    const today = new Date().getDate();

    // remind every 25th
    if (today >= 1) {

        const container =
document.getElementById("notificationsContainer");

if(container){

container.innerHTML =
`
<div class="card">
<h3>🔔 Contribution Reminder</h3>
<p>
Today is contribution day.
Minimum contribution is KSh 50.
Please make your contribution before midnight.
</p>
</div>
`
+ container.innerHTML;

}

    }
}
function filterMembers() {

    const input = document
        .getElementById("memberSearch")
        .value
        .toLowerCase();

    const cards = document
        .querySelectorAll("#membersContainer .card");

    cards.forEach(card => {

        const text = card.innerText.toLowerCase();

        if (text.includes(input)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }

    });

}


function copyMpesaNumber() {
    const number = "0743361713";

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(number)
            .then(() => showPopup("M-Pesa number copied.", "success"))
            .catch(() => showPopup("Could not copy the number.", "error"));
        return;
    }

    const temp = document.createElement("textarea");
    temp.value = number;
    document.body.appendChild(temp);
    temp.select();

    try {
        document.execCommand("copy");
        showPopup("M-Pesa number copied.", "success");
    } catch (error) {
        showPopup("Could not copy the number.", "error");
    }

    temp.remove();
}
function getMostRecentWeekdayDate(value, targetDay) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const diff = (date.getDay() - targetDay + 7) % 7;
    date.setDate(date.getDate() - diff);
    date.setHours(0, 0, 0, 0);
    return date;
}

async function loadContributionDayTotals() {
    try {
        const { data, error } = await db
            .from("contributions")
            .select("amount, created_at");

        if (error) {
            console.error("Contribution day error:", error);
            return;
        }

        const contributions = data || [];
        const now = new Date();

        const currentSaturday = getMostRecentWeekdayDate(now, 6);
        const currentWednesday = getMostRecentWeekdayDate(now, 3);

        let wednesdayTotal = 0;
        let saturdayTotal = 0;

        contributions.forEach(item => {
            const collectionDate = getContributionCollectionDate(item.created_at);
            if (!collectionDate) return;

            const amount = Number(item.amount || 0);

            if (collectionDate.getTime() === currentSaturday.getTime()) {
                saturdayTotal += amount;
            }

            if (collectionDate.getTime() === currentWednesday.getTime()) {
                wednesdayTotal += amount;
            }
        });

        const wednesdayEl = document.getElementById("wednesdayAmount");
        const saturdayEl = document.getElementById("saturdayAmount");

        if (wednesdayEl) {
            wednesdayEl.innerText = "KSh " + wednesdayTotal.toLocaleString() + " collected";
        }

        if (saturdayEl) {
            saturdayEl.innerText = "KSh " + saturdayTotal.toLocaleString() + " collected";
        }

    } catch (error) {
        console.error("Contribution day error:", error);
    }
}
/* Android/browser Back is handled by openMemberScreen/popstate above. */

function createSimplePdf(lines, title) {
    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 40;
    const lineHeight = 16;
    const maxLines = 46;

    const pages = [];
    let page = [];
    lines.forEach(line => {
        if (page.length >= maxLines) {
            pages.push(page);
            page = [];
        }
        page.push(String(line));
    });
    if (page.length || !pages.length) pages.push(page);

    const objects = [];
    const addObject = body => {
        objects.push(body);
        return objects.length;
    };

    const catalogId = addObject("");
    const pagesId = addObject("");
    const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    const pageIds = [];

    pages.forEach(pageLines => {
        const commands = ["BT", "/F1 10 Tf", `${margin} ${pageHeight - 55} Td`];
        pageLines.forEach((line, index) => {
            const safe = line
                .replace(/[^\x20-\x7E]/g, "?")
                .replace(/\\/g, "\\\\")
                .replace(/\(/g, "\\(")
                .replace(/\)/g, "\\)");
            if (index > 0) commands.push(`0 -${lineHeight} Td`);
            commands.push(`(${safe}) Tj`);
        });
        commands.push("ET");
        const stream = commands.join("\n");
        const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
        const pageId = addObject(
            `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`
        );
        pageIds.push(pageId);
    });

    objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

    let pdf = "%PDF-1.4\n%RIHULA\n";
    const offsets = [0];
    objects.forEach((obj, i) => {
        offsets.push(pdf.length);
        pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
    });
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i < offsets.length; i++) {
        pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;

    return new Blob([pdf], { type: "application/pdf" });
}

function saveStatementPdf(blob, fileName, pwaWindow) {
    const pdfUrl = URL.createObjectURL(blob);
    const isPwa = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;

    if (isPwa) {
        if (pwaWindow && !pwaWindow.closed) {
            pwaWindow.location.href = pdfUrl;
        } else {
            // Popup blockers can still stop a blank window. Navigate the PWA
            // directly to the generated PDF as the final fallback.
            window.location.href = pdfUrl;
        }
    } else {
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = fileName;
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
}

async function downloadStatement() {
    const button = document.querySelector('[onclick="downloadStatement()"]');
    const isPwa = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
    let pwaWindow = null;

    // Open a blank tab immediately while the click is still user-initiated.
    // After the async Supabase reads finish, the generated PDF is loaded into it.
    if (isPwa) {
        pwaWindow = window.open("about:blank", "_blank");
    }

    try {
        const user = JSON.parse(localStorage.getItem("loggedUser"));
        if (!user || !user.phone) {
            showPopup("Unable to identify member", "error");
            return;
        }

        if (button) {
            button.disabled = true;
            button.innerText = "⏳ Preparing...";
        }

        const { data: contributions, error: contributionError } = await db
            .from("contributions")
            .select("amount, created_at")
            .eq("member_phone", String(user.phone))
            .order("created_at", { ascending: true });

        if (contributionError) throw contributionError;

        const { data: withdrawals, error: withdrawalError } = await db
            .from("withdrawals")
            .select("amount, reason, created_at")
            .eq("member_phone", String(user.phone))
            .order("created_at", { ascending: true });

        if (withdrawalError) throw withdrawalError;

        // Group contributions by the official collection day:
        // Sat/Sun/Mon/Tue -> Saturday; Wed/Thu/Fri -> Wednesday.
        const contributionGroups = new Map();
        (contributions || []).forEach(item => {
            const collectionDate = getContributionCollectionDate(item.created_at);
            if (!collectionDate) return;
            const key = [collectionDate.getFullYear(), collectionDate.getMonth() + 1, collectionDate.getDate()].join("-");
            const existing = contributionGroups.get(key) || {
                type: "Contribution",
                amount: 0,
                date: collectionDate,
                reason: "Savings contribution"
            };
            existing.amount += Number(item.amount || 0);
            contributionGroups.set(key, existing);
        });

        const transactions = [
            ...Array.from(contributionGroups.values()),
            ...(withdrawals || []).map(item => ({
                type: "Withdrawal",
                amount: Number(item.amount || 0),
                date: item.created_at,
                reason: item.reason || "Savings withdrawal"
            }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date));

        let totalContributions = 0;
        let totalWithdrawals = 0;
        transactions.forEach(item => {
            if (item.type === "Contribution") totalContributions += item.amount;
            else totalWithdrawals += item.amount;
        });

        const balance = totalContributions - totalWithdrawals;

        const lines = [
            "RIHULA MUKHOBOLA ASSOCIATION",
            "MEMBER SAVINGS STATEMENT",
            "",
            `Member: ${user.name || "Member"}`,
            `Phone: ${user.phone}`,
            `Generated: ${new Date().toLocaleDateString("en-GB")}`,
            "",
            "TRANSACTION HISTORY",
            ""
        ];

        if (!transactions.length) {
            lines.push("No transactions found.");
        } else {
            transactions.forEach(item => {
                const date = item.type === "Contribution"
                    ? formatContributionCollectionDate(item.date)
                    : new Date(item.date).toLocaleDateString("en-GB");
                const sign = item.type === "Contribution" ? "+" : "-";
                lines.push(`${date} | ${item.type} | ${sign}KSh ${item.amount.toLocaleString()}`);
            });
        }

        lines.push(
            "",
            "SUMMARY",
            `Total Contributions: KSh ${totalContributions.toLocaleString()}`,
            `Total Withdrawals: KSh ${totalWithdrawals.toLocaleString()}`,
            `NET SAVINGS: KSh ${balance.toLocaleString()}`
        );

        const safeName = (user.name || "member")
            .replace(/[^a-z0-9]/gi, "_")
            .replace(/_+/g, "_")
            .replace(/^_|_$/g, "")
            .toLowerCase();
        const fileName = `RIHULA_Statement_${safeName || "member"}.pdf`;

        const pdfBlob = createSimplePdf(lines, "MEMBER SAVINGS STATEMENT");
        saveStatementPdf(pdfBlob, fileName, pwaWindow);

        showPopup(
            window.matchMedia && window.matchMedia("(display-mode: standalone)").matches
                ? "✅ Statement opened. Use the PDF viewer's Download button to save it."
                : "✅ Statement download started.",
            "success"
        );

    } catch (error) {
        console.error("Statement download error:", error);
        showPopup("❌ Unable to create statement. Please try again.", "error");
    } finally {
        if (button) {
            button.disabled = false;
            button.innerText = "📥 Download Statement";
        }
    }
}

