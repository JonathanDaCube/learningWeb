import { rtdb, ref, get, runTransaction } from './firebase-config.js';
import { loadDailyQuiz } from './daily-quiz.mjs';

async function read(path) {
  const snapshot = await get(ref(rtdb, path));
  return snapshot.val();
}

export function getDailyQuiz(date) {
  return loadDailyQuiz(date, {
    readSelection: day => read(`dailyQuizzes/${day}`),
    readQuizzes: () => read('quizzes'),
    readQuiz: id => read(`quizzes/${id}`),
    claimSelection: async (day, candidate) => {
      try {
        const result = await runTransaction(ref(rtdb, `dailyQuizzes/${day}`), current =>
          current === null ? candidate : undefined
        );
        return result.snapshot.val();
      } catch (error) {
        const existing = await read(`dailyQuizzes/${day}`);
        if (typeof existing === 'string' && existing) return existing;
        throw error;
      }
    }
  });
}
