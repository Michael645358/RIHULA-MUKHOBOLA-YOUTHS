/* RIHULA Supabase Auth compatibility helpers */
(function () {
  "use strict";
  const SESSION_KEY = "rihulaMemberSession";
  function normalizeKenyanPhone(phone) {
    let value = String(phone || "").trim().replace(/[\s\-()]/g, "");
    if (value.startsWith("+254")) value = "0" + value.slice(4);
    else if (value.startsWith("254")) value = "0" + value.slice(3);
    return value;
  }
  function saveSession(member) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ member_id: member.id, auth_id: member.auth_id, created_at: new Date().toISOString() }));
    localStorage.setItem("loggedUser", JSON.stringify(member));
  }
  async function clearSession() {
    localStorage.removeItem(SESSION_KEY); localStorage.removeItem("loggedUser");
    try { await db.auth.signOut(); } catch (_) {}
  }
  function getSessionMember() { try { return JSON.parse(localStorage.getItem("loggedUser") || "null"); } catch (_) { return null; } }
  async function registerMember({name, phone, email, password}) {
    if (typeof window.waitForRihulaDb === "function") await window.waitForRihulaDb();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanName = String(name || "").trim();
    const cleanPhone = normalizeKenyanPhone(phone);
    // Use the current deployed site instead of a hard-coded GitHub account.
    const redirect = new URL("auth-callback.html", window.location.href).href;

    const { data, error } = await db.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: redirect,
        data: { name: cleanName, phone: cleanPhone }
      }
    });

    if (error) throw error;
    if (!data || !data.user) throw new Error("The account could not be created.");

    return { success: true, user: data.user, session: data.session };
  }
  async function loginMember(loginId, password) {
    if (typeof window.waitForRihulaDb === "function") await window.waitForRihulaDb();

    let loginEmail = String(loginId || "").trim().toLowerCase();

    // Supabase password login requires an email. If the member enters a
    // Kenyan phone number, resolve that number to the member's registered email.
    if (!loginEmail.includes("@")) {
      const phone = normalizeKenyanPhone(loginId);
      const { data: phoneMember, error: phoneError } = await db
        .from("members")
        .select("email, auth_id, is_member")
        .eq("phone", phone)
        .maybeSingle();

      if (phoneError) {
        console.error("PHONE LOOKUP ERROR:", phoneError);
        throw new Error("We could not verify that phone number. Please try again.");
      }

      if (!phoneMember || !phoneMember.email) {
        throw new Error("No member account was found for that phone number.");
      }

      loginEmail = String(phoneMember.email).trim().toLowerCase();
    }

    const { data, error } = await db.auth.signInWithPassword({
      email: loginEmail,
      password
    });

    if (error) throw error;
    if (!data || !data.user) throw new Error("The login could not be completed.");

    const { data: member, error: memberError } = await db
      .from("members")
      .select("*")
      .eq("auth_id", data.user.id)
      .single();

    if (memberError || !member) throw new Error("Your member profile could not be found.");
    if (member.is_member !== true) throw new Error("This account does not have member access.");

    saveSession(member);
    return member;
  }
  window.RihulaCustomAuth = { normalizeKenyanPhone, registerMember, loginMember, saveSession, clearSession, getSessionMember };

})();
