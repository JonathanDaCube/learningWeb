import { rtdb, ref, get, update } from './firebase-config.js';
import { validScores } from './leaderboard-math.mjs';

export async function syncLeaderboard(user) {
  const snapshot = await get(ref(rtdb, `users/${user.uid}/scores`));
  const changes = { displayName: user.displayName || '學習者' };
  for (const [date, score] of validScores(snapshot.val())) {
    changes[`scores/${date}`] = { correct: score.correct, total: score.total };
  }
  await update(ref(rtdb, `leaderboard/${user.uid}`), changes);
}
