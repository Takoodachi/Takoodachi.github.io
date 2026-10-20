// Run with: node tests/numberlink.test.js
const assert = require("node:assert/strict");
const NL = require("../js/numberlink.js");

// Must match CLUES in js/main.js.
const CLUES = [[0, 0], [1, 1], [3, 1], [0, 3], [2, 3], [3, 3], [4, 2]];
const SOLUTION = [[0, 0], [0, 1], [1, 1], [1, 0], [2, 0], [3, 0], [4, 0], [4, 1], [3, 1], [2, 1], [2, 2], [1, 2], [0, 2], [0, 3], [0, 4], [1, 4], [1, 3], [2, 3], [2, 4], [3, 4], [4, 4], [4, 3], [3, 3], [3, 2], [4, 2]];
const fresh = () => NL.create(5, CLUES);
const draw = (s, cells) => { assert.ok(NL.start(s, cells[0])); cells.slice(1).forEach((c) => assert.ok(NL.extend(s, c), `extend to ${c}`)); };

// The intended solution works.
let s = fresh();
draw(s, SOLUTION);
assert.ok(NL.solved(s));

// It is the only solution: try every path the rules allow.
const solutions = [];
(function search(st) {
  if (NL.solved(st)) { solutions.push(st.path.map(String).join(" ")); return; }
  const [r, c] = st.path[st.path.length - 1];
  for (const cell of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
    if (cell.some((v) => v < 0 || v > 4) || st.path.some((p) => p[0] === cell[0] && p[1] === cell[1])) continue;
    const next = { ...st, path: st.path.slice() };
    if (NL.extend(next, cell)) search(next);
  }
})((() => { const st = fresh(); NL.start(st, CLUES[0]); return st; })());
assert.deepEqual(solutions, [SOLUTION.map(String).join(" ")]);

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
