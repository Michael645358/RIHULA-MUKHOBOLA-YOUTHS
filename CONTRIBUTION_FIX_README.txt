RIHULA CONTRIBUTION FIX

Files in this ZIP are replacements from the original project:
- record-contribution.html
- script.js
- admin.js

What was fixed:
1. Member phone is verified in the members table BEFORE any contribution insert.
2. Non-existent members are rejected and nothing is saved.
3. Pending members are rejected and nothing is saved.
4. Rejected/blocked/suspended/inactive members are rejected and nothing is saved.
5. Confirmation appears BEFORE the contribution is inserted.
6. Confirmation shows the matched member name, phone and amount.
7. Cancelling confirmation never inserts a contribution.
8. The member is checked again immediately before insert.
9. Phone formats such as 07..., 2547... and +2547... are matched where possible.
10. Script cache-busting versions were updated so the browser loads the fixed JavaScript.

IMPORTANT:
Replace the matching files in your GitHub project. Do not add the old contribution function back from a backup file.
