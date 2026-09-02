/* RIHULA Admin Security Guard
 * Uses Supabase Auth + the authenticated member's role.
 * No admin PIN or admin secret is stored in browser code.
 */
(function () {
  "use strict";

    const SESSION_KEY = "rihulaAdminUser";

  function clearAdminSession() {
    sessionStorage.removeItem("adminVerified");
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem("rihulaAdminActivityLogged");
    localStorage.removeItem("adminAccess");
  }

  async function getAdminUser() {
    if (typeof window.waitForRihulaDb === "function") {
      await window.waitForRihulaDb();
    }
    if (!window.db) throw new Error("Supabase is not initialized.");

    const { data: authData, error: authError } = await window.db.auth.getUser();
    if (authError || !authData?.user) return null;

    const { data: member, error } = await window.db
      .from("members")
      .select("id, auth_id, name, email, phone, role, status, is_admin, is_member")
      .eq("auth_id", authData.user.id)
      .maybeSingle();

    if (error) {
      console.error("ADMIN MEMBER LOOKUP:", error);
      throw error;
    }

    if (!member || member.is_admin !== true) {
      return null;
    }

    const normalizedStatus = String(member.status || "").trim().toLowerCase();
    if (member.status && ["blocked", "suspended", "inactive"].includes(normalizedStatus)) {
      return null;
    }

    return member;
  }

  async function requireAdmin() {
    try {
      const admin = await getAdminUser();
      if (!admin) {
        clearAdminSession();
        if (!location.pathname.endsWith("admin-login.html")) {
          location.replace("admin-login.html");
        }
        return null;
      }

      sessionStorage.setItem("adminVerified", "true");
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(admin));
      return admin;
    } catch (error) {
      console.error("ADMIN SECURITY CHECK:", error);
      clearAdminSession();
      if (!location.pathname.endsWith("admin-login.html")) {
        location.replace("admin-login.html");
      }
      return null;
    }
  }

  async function logActivity(action) {
    try {
      if (!window.db || !action) return false;
      const { error } = await window.db.rpc("log_admin_activity", {
        p_action: String(action).trim()
      });
      if (error) {
        console.warn("Admin activity log failed:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.warn("Admin activity log failed:", error);
      return false;
    }
  }

  async function adminLogout() {
    try {
      await window.db.auth.signOut();
    } catch (error) {
      console.warn("Admin sign out:", error);
    }
    clearAdminSession();
    location.replace("admin-login.html");
  }

  window.RihulaAdmin = { getAdminUser, requireAdmin, adminLogout, clearAdminSession, logActivity };
})();