/* RIHULA Withdrawal Fix
 * Requires the Supabase client to be available as `db`.
 *
 * Expected tables:
 *   contributions: member_phone (or phone), amount
 *   withdrawals:    member_phone (or phone), amount, reason, created_at
 *
 * The helper first discovers which phone/amount columns are available,
 * validates the amount, calculates available balance, then inserts the
 * withdrawal and returns a useful error instead of failing silently.
 */
(function () {
  "use strict";

  function cleanPhone(value) {
    return String(value || "").trim().replace(/[\\s()-]/g, "");
  }

  function money(value) {
    var n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  async function firstWorkingQuery(table, phone, select) {
    var phoneColumns = ["member_phone", "phone", "memberPhone"];
    var lastError = null;

    for (var i = 0; i < phoneColumns.length; i++) {
      var col = phoneColumns[i];
      var filter = {};
      filter[col] = phone;
      var result = await db.from(table).select(select).eq(col, phone);
      if (!result.error) return result;
      lastError = result.error;
    }
    throw lastError || new Error("Unable to query " + table);
  }

  async function insertWithdrawal(phone, amount, reason) {
    var candidates = [
      { member_phone: phone, amount: amount, reason: reason },
      { phone: phone, amount: amount, reason: reason },
      { member_phone: phone, amount: amount },
      { phone: phone, amount: amount }
    ];

    var lastError = null;
    for (var i = 0; i < candidates.length; i++) {
      var result = await db.from("withdrawals").insert(candidates[i]).select().single();
      if (!result.error) return result.data;
      lastError = result.error;
    }
    throw lastError || new Error("Withdrawal could not be saved.");
  }

  async function getAvailableBalance(phone) {
    var contributionResult = await firstWorkingQuery("contributions", phone, "*");
    var withdrawalResult;

    try {
      withdrawalResult = await firstWorkingQuery("withdrawals", phone, "*");
    } catch (e) {
      withdrawalResult = { data: [] };
    }

    var contributions = (contributionResult.data || []).reduce(function (sum, row) {
      return sum + money(row.amount ?? row.contribution_amount ?? row.value);
    }, 0);

    var withdrawals = (withdrawalResult.data || []).reduce(function (sum, row) {
      return sum + money(row.amount ?? row.withdrawal_amount ?? row.value);
    }, 0);

    return {
      contributions: contributions,
      withdrawals: withdrawals,
      available: Math.max(0, contributions - withdrawals)
    };
  }

  window.processWithdrawal = async function (phone, amount, reason) {
    if (!window.db) throw new Error("Supabase is not initialized.");
    phone = cleanPhone(phone);
    amount = money(amount);
    reason = String(reason || "").trim();

    if (!phone) throw new Error("Enter the member phone number.");
    if (!amount || amount <= 0) throw new Error("Enter a valid withdrawal amount.");

    var balance = await getAvailableBalance(phone);

    if (amount > balance.available) {
      throw new Error(
        "Insufficient balance. Available: KSh " +
        balance.available.toLocaleString("en-KE", {minimumFractionDigits: 2})
      );
    }

    var saved = await insertWithdrawal(phone, amount, reason);
    return {
      success: true,
      withdrawal: saved,
      balanceBefore: balance.available,
      balanceAfter: balance.available - amount
    };
  };

  window.getWithdrawalBalance = getAvailableBalance;
})();
