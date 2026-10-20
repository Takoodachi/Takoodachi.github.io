// Run with: node tests/numberlink.test.js
const assert = require("node:assert/strict");
const NL = require("../js/numberlink.js");

const ENDS = { 1: [[0, 0], [4, 1]], 2: [[0, 2], [3, 1]], 3: [[0, 4], [3, 3]], 4: [[1, 2], [4, 2]], 5: [[1, 4], [4, 3]] };
const SOLUTION = {
  1: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [4, 1]],
  2: [[0, 2], [0, 1], [1, 1], [2, 1], [3, 1]],
  3: [[0, 4], [0, 3], [1, 3], [2, 3], [3, 3]],
  4: [[1, 2], [2, 2], [3, 2], [4, 2]],
  5: [[1, 4], [2, 4], [3, 4], [4, 4], [4, 3]],
};
const draw = (s, cells) => { assert.ok(NL.start(s, cells[0])); cells.slice(1).forEach((c) => assert.ok(NL.extend(s, c), `extend to ${c}`)); };

// The shipped puzzle is solvable and the solver agrees.
let s = NL.create(5, ENDS);
for (const n in SOLUTION) draw(s, SOLUTION[n]);
assert.equal(NL.filled(s), 25);
assert.ok(NL.solved(s));

// Joined everything but left squares empty: not solved.
s = NL.create(5, ENDS);
draw(s, [[1, 2], [2, 2], [3, 2], [4, 2]]);
assert.ok(NL.isJoined(s, 4));
assert.ok(!NL.solved(s));

// Paths cannot enter another number, or jump squares.
s = NL.create(5, ENDS);
NL.start(s, [0, 0]);
assert.ok(NL.extend(s, [0, 1]));
assert.ok(!NL.extend(s, [0, 2]), "blocked by number 2");
assert.ok(!NL.extend(s, [2, 1]), "not adjacent");

// Backtracking trims the path.
assert.ok(NL.extend(s, [1, 1]));
assert.ok(NL.extend(s, [0, 1]));
assert.deepEqual(s.paths[1], [[0, 0], [0, 1]]);

// Crossing another path cuts it at the crossing.
s = NL.create(5, ENDS);
draw(s, [[1, 2], [2, 2], [3, 2]]);
draw(s, [[3, 1], [2, 1]]);
draw(s, [[0, 4], [0, 3], [1, 3], [2, 3]]);
assert.ok(NL.extend(s, [2, 2]));
assert.deepEqual(s.paths[4], [[1, 2]]);

// A finished path stops growing, and picking it up mid-way keeps the head.
s = NL.create(5, ENDS);
draw(s, SOLUTION[4]);
assert.ok(!NL.extend(s, [4, 1]));
assert.ok(NL.start(s, [2, 2]));
assert.deepEqual(s.paths[4], [[1, 2], [2, 2]]);

console.log("numberlink: all checks passed");
