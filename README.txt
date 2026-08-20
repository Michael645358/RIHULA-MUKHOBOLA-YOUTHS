RIHULA MEMBER DASHBOARD PATCH ONLY

This is NOT the full RIHULA system.
It only adds the Achievement Centre/reward layer to the existing member dashboard.

Files:
1. supabase/migrations/20260820_member_achievements.sql
   - Adds achievement definitions and member achievement tracking.
   - Highest tier: KSh 15,000 savings -> KSh 15,000 reward.
   - Does not replace the existing contributions or Daraja tables.

2. member-dashboard/achievement-section.html
   - Dashboard section to insert into your existing member HTML.

3. member-dashboard/achievements.css
   - Styling for the new section only.

4. member-dashboard/achievements.js
   - Loads savings, points, level, progress and achievement status.
   - Uses your existing Supabase client variable `db`.

Integration:
- Run the SQL migration in Supabase.
- Add the HTML section to member dashboard.
- Include achievements.css.
- Include achievements.js after your existing Supabase/client initialization.
- Uncomment loadMemberAchievements() after the member session is ready.

Important:
The reward is displayed as an achievement reward. It is NOT automatically added to member savings or paid out. Admin approval/payment should remain a separate process.
