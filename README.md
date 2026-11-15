# learningWeb
Answer some questions every day.

## Leaderboard

The leaderboard ranks signed-in users by correct answers for the current UTC day or Monday–Sunday week. Average score is the mean quiz percentage for that period; daily and weekly streaks count consecutive completed days or weeks, including the previous day or week if the current one is not yet complete.

On sign-in and after a cloud score is saved, the app copies the user's Google display name and score totals (not answers, email, or profile information) to `leaderboard/{uid}`. Existing cloud history appears after that user visits the quiz or leaderboard. Local-only scores are not published. Signed-in users can read these public summaries. Configure Firebase Realtime Database rules to allow authenticated reads of `leaderboard` and writes only to `leaderboard/$uid` where `auth.uid === $uid`; preserve the existing rules for other paths. Client-written scores are not protected against manipulation by their owner.
