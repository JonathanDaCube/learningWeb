# learningWeb
Answer some questions every day.

## Leaderboard

The leaderboard ranks signed-in users by correct answers for the current UTC day or Monday–Sunday week. Average score is the mean quiz percentage for that period; daily and weekly streaks count consecutive completed days or weeks, including the previous day or week if the current one is not yet complete.

On sign-in and after a cloud score is saved, the app copies the user's Google display name and score totals (not answers, email, or profile information) to `leaderboard/{uid}`. Existing cloud history appears after that user visits the quiz or leaderboard. Local-only scores are not published. Signed-in users can read these public summaries. Configure Firebase Realtime Database rules to allow authenticated reads of `leaderboard` and writes only to `leaderboard/$uid` where `auth.uid === $uid`; preserve the existing rules for other paths. Client-written scores are not protected against manipulation by their owner.

## Realtime Database rules

`firebase.json` and `.firebaserc` configure the Firebase CLI for the existing `learning-website-b66a9` project. `database.rules.json` allows users to read and write only their own profile and score history, lets signed-in users read the leaderboard, and limits leaderboard writes to the owner's display name and score totals. Other paths are denied. These rules do not prevent users from changing their own scores.

Before deploying, compare this file with the currently deployed rules and merge any additional permissions your project needs. Deploying replaces the database's existing rules and can break other clients or paths. With the [Firebase CLI](https://firebase.google.com/docs/cli) installed and an account authorized for the project, run:

```sh
firebase login
firebase deploy --only database
```

The rules are not deployed automatically. The existing signup code stores a password in the profile; these rules restrict profile access, but plaintext passwords should not be stored in the database.

## Daily quizzes

Quizzes live under `quizzes/{quizId}` in Realtime Database; `quiz-seed.json` contains the original passage, 20 reading, main-idea, and fill-in-the-blank quizzes, and two quizzes with 20 true/false/not-given questions in total. Each quiz needs `traditional` and `simplified` versions with matching question and choice order and zero-based answer indexes. Add more quizzes to the seed file or use the Firebase console. Do not edit or delete a quiz while it is in use, since daily selections reference its ID.

After reviewing and deploying the rules, an authorized administrator can import the seed without replacing unrelated quiz IDs:

```sh
firebase database:update /quizzes quiz-seed.json
```

This overwrites any existing quiz with the same ID. The first signed-in visitor of each UTC day randomly selects a valid quiz; a transaction stores its ID under `dailyQuizzes/{YYYY-MM-DD}` so concurrent visitors see the same passage. At least one quiz must be imported before the page can load. A single quiz will naturally repeat every day. Clients can read answers and create a daily selection, so this is not tamper-proof; trusted server-side selection and grading would be needed for competitive use. Dates use the visitor's device clock.
