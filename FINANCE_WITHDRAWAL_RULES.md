# RIHULA Finance Rule

All displayed savings balances now use:

`Net Savings = SUM(contributions.amount) - SUM(withdrawals.amount)`

The member count remains the actual number of members and is not reduced by withdrawals.

The leaderboard, member savings, group savings, admin Total Savings, and group goal progress use net savings.

The contribution-history/collection screens can still show gross contributions because those are contribution records, not current balances.

If withdrawals are inserted successfully but the UI cannot read them, check Supabase RLS SELECT permission on `withdrawals` for the logged-in member/admin role.
