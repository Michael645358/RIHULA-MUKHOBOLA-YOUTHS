RIHULA ALL MEMBERS — rebuilt to match the requested modern reference.

This version:
- Uses a fixed desktop table layout like the reference design.
- Keeps the table horizontally scrollable on phones instead of collapsing into a narrow broken column.
- Sorts members by the Supabase finance rank / net savings.
- Displays contribution, withdrawal, net savings, rank and achievements.
- Includes search, role/status filters, pagination, history, edit and delete.
- Does NOT load script.js on all-members.html because the project's script.js has a top-level `db` reference
  that causes `ReferenceError: db is not defined` before the page can load.
- Uses the existing supabase.js and window.db.
- Does not change your Supabase database or SQL functions.
