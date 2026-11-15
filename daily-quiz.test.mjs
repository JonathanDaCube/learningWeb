import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { loadDailyQuiz, validateQuiz } from './daily-quiz.mjs';

const seed = JSON.parse(await readFile(new URL('./quiz-seed.json', import.meta.url), 'utf8'));
const original = seed['learning-chinese'];

test('seed has valid aligned translations and answer indexes', () => {
  assert.equal(validateQuiz(original), true);
  const invalid = structuredClone(original);
  invalid.simplified.questions[0].a = 999;
  assert.equal(validateQuiz(invalid), false);
  invalid.simplified.questions[0].a = 0;
  assert.equal(validateQuiz(invalid), false);
});

test('new quiz bank contains the requested formats with ten valid questions each', () => {
  const ids = Object.keys(seed);
  assert.equal(ids.filter(id => id.startsWith('reading-')).length, 7);
  assert.equal(ids.filter(id => id.startsWith('main-')).length, 6);
  assert.equal(ids.filter(id => id.startsWith('blank-')).length, 7);
  assert.equal(ids.filter(id => id.startsWith('tf-')).length, 2);
  for (const [id, quiz] of Object.entries(seed)) {
    assert.ok(validateQuiz(quiz), id);
    for (const lang of ['traditional', 'simplified']) {
      assert.equal(quiz[lang].questions.length, 10, id);
      for (const question of quiz[lang].questions) {
        assert.equal(question.choices.length, id.startsWith('tf-') ? 3 : 4, id);
        assert.equal(new Set(question.choices).size, question.choices.length, id);
      }
    }
  }
  assert.deepEqual(new Set(ids.filter(id => id.startsWith('tf-'))
    .flatMap(id => seed[id].simplified.questions.map(question => question.a))), new Set([0, 1, 2]));
});

test('first visitor selects a valid quiz and later visitors reuse it', async () => {
  const bank = { a: original, b: original, invalid: {} };
  let selected = null;
  let calls = 0;
  const storage = {
    readSelection: async () => selected,
    readQuizzes: async () => { calls++; return bank; },
    readQuiz: async id => bank[id],
    claimSelection: async (_date, candidate) => { selected = selected || candidate; return selected; },
    random: () => 0.9
  };
  assert.equal((await loadDailyQuiz('2026-11-15', storage)).id, 'b');
  storage.random = () => 0;
  assert.equal((await loadDailyQuiz('2026-11-15', storage)).id, 'b');
  assert.equal(calls, 1);
});

test('concurrent visitors use the winning transaction value', async () => {
  const bank = { a: original, b: original };
  let selected = null;
  const storage = random => ({
    readSelection: async () => null,
    readQuizzes: async () => bank,
    readQuiz: async id => bank[id],
    claimSelection: async (_date, candidate) => { selected = selected || candidate; return selected; },
    random
  });
  const results = await Promise.all([
    loadDailyQuiz('2026-11-15', storage(() => 0)),
    loadDailyQuiz('2026-11-15', storage(() => 0.99))
  ]);
  assert.deepEqual(results.map(result => result.id), ['a', 'a']);
});

test('missing or malformed quizzes and storage failures are reported', async () => {
  const storage = {
    readSelection: async () => null,
    readQuizzes: async () => ({ invalid: {} }),
    readQuiz: async () => null,
    claimSelection: async () => null
  };
  await assert.rejects(loadDailyQuiz('2026-11-15', storage), /No valid quizzes/);
  storage.readSelection = async () => 'missing';
  await assert.rejects(loadDailyQuiz('2026-11-15', storage), /missing or invalid/);
  storage.readSelection = async () => { throw new Error('permission denied'); };
  await assert.rejects(loadDailyQuiz('2026-11-15', storage), /permission denied/);
});
