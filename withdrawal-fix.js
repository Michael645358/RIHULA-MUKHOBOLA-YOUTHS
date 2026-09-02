/* RIHULA Withdrawal Engine
 * Uses one atomic Supabase transaction so a withdrawal cannot overdraw the
 * member balance because of stale/concurrent browser calculations.
 */
(function () {
  "use strict";

  function cleanPhone(value) {
    let p = String(value || "").trim().replace(/[\s()\-]/g, "");
    if (p.startsWith("+254")) p = "0" + p.slice(4);
    else if (p.startsWith("254")) p = "0" + p.slice(3);
    return p;
  }

  function money(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  window.processWithdrawal = async function (phone, amount, reason) {
    if (typeof window.waitForRihulaDb === "function") await window.waitForRihulaDb();
    if (!window.db) throw new Error("Supabase is not initialized.");
    phone = cleanPhone(phone);
    amount = money(amount);
    reason = String(reason || "").trim();

    if (!phone) throw new Error("Enter the member phone number.");
    if (!amount || amount <= 0) throw new Error("Enter a valid withdrawal amount.");

    const { data, error } = await window.db.rpc("process_member_withdrawal", {
      p_phone: phone,
      p_amount: amount,
      p_reason: reason || "Savings withdrawal"
    });

    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("Withdrawal was not confirmed by the database.");

    return {
      success: true,
      withdrawal: { id: row.withdrawal_id, amount },
      balanceBefore: money(row.balance_before),
      balanceAfter: money(row.balance_after)
    };
  };

  window.getWithdrawalBalance = async function (phone) {
    if (typeof window.waitForRihulaDb === "function") await window.waitForRihulaDb();
    if (!window.db) throw new Error("Supabase is not initialized.");
    const { data, error } = await window.db.rpc("get_member_finance", {
      p_phone: cleanPhone(phone)
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return {
      contributions: money(row?.contributions),
      withdrawals: money(row?.withdrawals),
      available: money(row?.net_savings)
    };
  };
})();
