/* RIHULA Admin Security Guard
 * Uses Supabase Auth + the authenticated member's role.
 * No admin PIN or admin secret is stored in browser code.
 */
(function () {
  "use strict";

  const ADMIN_ROLES = ["admin", "administrator", "chairperson", "secretary", "treasurer"];
  const SESSION_KEY = "rihulaAdminUser";

  function normalizeRole(role) {
    return String(role || "").trim().toLowerCase();
  }

  function clearAdminSession() {
    sessionStorage.removeItem("adminVerified");
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("adminAccess");
  }

  async function getAdminUser() {
    if (!window.db) throw new Error("Supabase is not initialized.");

    const { data: authData, error: authError } = await window.db.auth.getUser();
    if (authError || !authData?.user) return null;

    const { data: member, error } = await window.db
      .from("members")
      .select("id, auth_id, name, email, phone, role, status")
      .eq("auth_id", authData.user.id)
      .maybeSingle();

    if (error) {
      console.error("ADMIN MEMBER LOOKUP:", error);
      throw error;
    }

    if (!member || !ADMIN_ROLES.includes(normalizeRole(member.role))) {
      return null;
    }

    if (member.status && ["blocked", "suspended", "inactive"].includes(normalizeRole(member.status))) {
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

  async function adminLogout() {
    try {
      await window.db.auth.signOut();
    } catch (error) {
      console.warn("Admin sign out:", error);
    }
    clearAdminSession();
    location.replace("admin-login.html");
  }

  window.RihulaAdmin = { getAdminUser, requireAdmin, adminLogout, clearAdminSession };
})();