function validTranslation(translation) {
  return translation && typeof translation.title === 'string' &&
    typeof translation.passage === 'string' &&
    Array.isArray(translation.questions) && translation.questions.length > 0 &&
    translation.questions.every(question =>
      question && typeof question.q === 'string' && Array.isArray(question.choices) &&
      question.choices.length > 0 && question.choices.every(choice => typeof choice === 'string') &&
      Number.isInteger(question.a) && question.a >= 0 && question.a < question.choices.length
    );
}

export function validateQuiz(quiz) {
  if (!quiz || !validTranslation(quiz.traditional) || !validTranslation(quiz.simplified)) return false;
  const traditional = quiz.traditional.questions;
  const simplified = quiz.simplified.questions;
  return traditional.length === simplified.length && traditional.every((question, index) =>
    question.choices.length === simplified[index].choices.length && question.a === simplified[index].a
  );
}

export async function loadDailyQuiz(date, { readSelection, readQuizzes, readQuiz, claimSelection, random = Math.random }) {
  let id = await readSelection(date);
  if (id === null) {
    const quizzes = await readQuizzes();
    const ids = Object.keys(quizzes || {}).filter(key => validateQuiz(quizzes[key])).sort();
    if (!ids.length) throw new Error('No valid quizzes are available');
    const candidate = ids[Math.floor(random() * ids.length)];
    id = await claimSelection(date, candidate);
  }
  if (typeof id !== 'string' || !id) throw new Error('Invalid daily quiz selection');
  const quiz = await readQuiz(id);
  if (!validateQuiz(quiz)) throw new Error('Selected quiz is missing or invalid');
  return { id, quiz };
}
