// Run with: node tests/numberlink.test.js
const assert = require("node:assert/strict");
const NL = require("../js/numberlink.js");

// A fixed puzzle for the rule checks below.
const CLUES = [[0, 0], [1, 1], [3, 1], [0, 3], [2, 3], [3, 3], [4, 2]];
const SOLUTION = [[0, 0], [0, 1], [1, 1], [1, 0], [2, 0], [3, 0], [4, 0], [4, 1], [3, 1], [2, 1], [2, 2], [1, 2], [0, 2], [0, 3], [0, 4], [1, 4], [1, 3], [2, 3], [2, 4], [3, 4], [4, 4], [4, 3], [3, 3], [3, 2], [4, 2]];
const fresh = () => NL.create(5, CLUES);
const draw = (s, cells) => { assert.ok(NL.start(s, cells[0])); cells.slice(1).forEach((c) => assert.ok(NL.extend(s, c), `extend to ${c}`)); };

// The intended solution works.
let s = fresh();
draw(s, SOLUTION);
assert.ok(NL.solved(s));

// Every finished path the game itself would accept, found by trying each legal move.
const allSolutions = (clues) => {
  const found = [];
  (function search(st) {
    if (NL.solved(st)) { found.push(st.path.map(String).join(" ")); return; }
    const [r, c] = st.path[st.path.length - 1];
    for (const cell of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
      if (cell.some((v) => v < 0 || v > 4) || st.path.some((p) => p[0] === cell[0] && p[1] === cell[1])) continue;
      const next = { ...st, path: st.path.slice() };
      if (NL.extend(next, cell)) search(next);
    }
  })((() => { const st = NL.create(5, clues); NL.start(st, clues[0]); return st; })());
  return found;
};

// It is the only solution.
assert.deepEqual(allSolutions(CLUES), [SOLUTION.map(String).join(" ")]);

// Generated puzzles: a path through every square, numbers in path order, and exactly one answer.
let seed = 1;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const counts = [];
let slowest = 0;
for (let i = 1; i <= 60; i++) {
  seed = i * 7919;
  const t = performance.now();
  const { clues, solution } = NL.generate(5, rand);
  slowest = Math.max(slowest, performance.now() - t);
  assert.equal(new Set(solution.map(String)).size, 25, "visits every square once");
  solution.slice(1).forEach((p, k) => assert.equal(Math.abs(p[0] - solution[k][0]) + Math.abs(p[1] - solution[k][1]), 1, "steps are adjacent"));
  const order = clues.map((c) => solution.findIndex((p) => p[0] === c[0] && p[1] === c[1]));
  assert.deepEqual(order, [...order].sort((a, b) => a - b), "numbers follow the path");
  assert.equal(order[0], 0);
  assert.equal(order[order.length - 1], 24);
  assert.deepEqual(allSolutions(clues), [solution.map(String).join(" ")], `seed ${i} has one answer`);
  counts.push(clues.length);
}
assert.ok(Math.min(...counts) >= 6, "at least six numbers");
console.log(`generated 60 puzzles: ${Math.min(...counts)}-${Math.max(...counts)} numbers, slowest ${slowest.toFixed(1)} ms`);

// Only 1 can start a path.
s = fresh();
assert.ok(!NL.start(s, [2, 2]), "empty square");
assert.ok(!NL.start(s, CLUES[1]), "number 2");

// Numbers must come in order: 3 is blocked until 2 is reached.
s = fresh();
draw(s, [[0, 0], [1, 0], [2, 0], [2, 1]]);
assert.ok(!NL.extend(s, [3, 1]), "3 before 2");
assert.equal(NL.reached(s), 1);

// No jumping, no crossing, and stepping back undoes one square.
s = fresh();
draw(s, [[0, 0], [0, 1], [1, 1], [1, 0]]);
assert.ok(!NL.extend(s, [3, 0]), "not adjacent");
assert.ok(!NL.extend(s, [0, 0]), "crosses itself");
assert.ok(NL.extend(s, [1, 1]));
assert.deepEqual(s.path, [[0, 0], [0, 1], [1, 1]]);

// Picking the path up mid-way keeps everything before that square.
assert.ok(NL.start(s, [0, 1]));
assert.deepEqual(s.path, [[0, 0], [0, 1]]);

// Reaching the last number early ends the path, and it isn't solved.
s = fresh();
draw(s, [...SOLUTION.slice(0, 18), [3, 3], [3, 2], [4, 2]]); // skips four squares on the right
assert.equal(NL.reached(s), 7);
assert.ok(!NL.solved(s));
assert.ok(!NL.extend(s, [4, 3]), "path ends on the last number");

console.log("numberlink: all checks passed");
