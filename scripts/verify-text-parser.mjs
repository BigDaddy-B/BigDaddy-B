/**
 * Verifies English -> SASL gloss parsing.
 *
 * Guards the phrase matcher against greedily swallowing words: a multi-word
 * window must only match when the whole window is a known sign, otherwise
 * signs disappear from the middle of a sentence without any error.
 *
 * Run with: npm run verify:parser
 */

import { parseTextToSignTokens, lookupSaslSign } from '../src/lib/saslDictionary.ts';

const CASES = [
  {
    input: 'Sawubona',
    expect: ['sawubona'],
    why: 'single known sign',
  },
  {
    input: 'Sawubona thank you water',
    expect: ['sawubona', 'thank_you', 'water'],
    why: 'three signs in a row — none may be swallowed by a greedy window match',
  },
  {
    input: 'thank you',
    expect: ['thank_you'],
    why: 'two-word phrase tag',
  },
  {
    input: 'I love you',
    expect: ['love'],
    why: 'phrase tag inside a sentence',
  },
  {
    input: 'help emergency doctor',
    expect: ['help_emergency', 'doctor'],
    why: 'consecutive signs with a multi-word first match',
  },
  {
    input: 'water please',
    expect: ['water', 'please'],
    why: 'two single-word signs',
  },
];

let passed = 0;
const failures = [];

for (const c of CASES) {
  const { tokens } = parseTextToSignTokens(c.input);
  const ids = tokens.filter((t) => !t.isFingerspelled).map((t) => t.signId);

  const ok =
    ids.length === c.expect.length && c.expect.every((id, i) => ids[i] === id);

  if (ok) passed++;
  else failures.push({ c, ids });

  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${JSON.stringify(c.input).padEnd(30)} -> ${JSON.stringify(ids)}`,
  );
}

// Unknown words must fall through to fingerspelling rather than silently
// matching an unrelated sign.
const { tokens: spelled } = parseTextToSignTokens('Zinhle');
const allSpelled = spelled.length > 0 && spelled.every((t) => t.isFingerspelled);
console.log(`${allSpelled ? 'PASS' : 'FAIL'}  unknown name is fingerspelled -> ${spelled.length} letters`);
if (allSpelled) passed++;
else failures.push({ c: { input: 'Zinhle', why: 'unknown word' }, ids: spelled.map((t) => t.gloss) });

// A phrase that merely contains a tag must not match the whole phrase.
const overreach = lookupSaslSign('sawubona thank you');
console.log(`${overreach === null ? 'PASS' : 'FAIL'}  containment does not match -> ${overreach?.id ?? 'null'}`);
if (overreach === null) passed++;
else failures.push({ c: { input: 'sawubona thank you', why: 'must not match' }, ids: [overreach.id] });

const total = CASES.length + 2;
console.log(`\n${passed}/${total} parser checks passed.`);

if (failures.length) {
  console.log('\nFailures:');
  for (const { c, ids } of failures) {
    console.log(`  ${c.input} (${c.why}): expected ${JSON.stringify(c.expect ?? 'n/a')}, got ${JSON.stringify(ids)}`);
  }
  process.exit(1);
}
