/* Number Link rules, kept free of the DOM so tests can run them in Node.
   One path starts on 1 and moves a square at a time. It must pass the numbers
   in order, may not cross itself, and ends on the last number. The puzzle is
   solved when that path has filled every square. */
(function (root) {
  "use strict";

  var same = function (a, b) { return a[0] === b[0] && a[1] === b[1]; };
  var adjacent = function (a, b) { return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1; };

  // clues[i] is the square holding number i + 1.
  function create(size, clues) {
    return { size: size, clues: clues, path: [] };
  }

  // The number on a square, or 0.
  function clueAt(s, cell) {
    return s.clues.findIndex(function (c) { return same(c, cell); }) + 1;
  }

  function indexOf(s, cell) {
    return s.path.findIndex(function (c) { return same(c, cell); });
  }

  // Highest number the path has reached; numbers can only be reached in order.
  function reached(s) {
    var n = 0;
    s.path.forEach(function (c) { n = clueAt(s, c) || n; });
    return n;
  }

  // Pointer down: start over from 1, or pick the path up where it was touched.
  function start(s, cell) {
    if (clueAt(s, cell) === 1) { s.path = [cell]; return true; }
    var i = indexOf(s, cell);
    if (i >= 0) { s.path = s.path.slice(0, i + 1); return true; }
    return false;
  }

  // Pointer moves onto a neighbouring square.
  function extend(s, cell) {
    var p = s.path;
    var last = p[p.length - 1];
    if (!last || !adjacent(last, cell)) return false;
    if (p.length > 1 && same(p[p.length - 2], cell)) { p.pop(); return true; } // step back
    if (indexOf(s, cell) >= 0) return false;
    if (clueAt(s, last) === s.clues.length) return false; // the last number ends the path
    var n = clueAt(s, cell);
    if (n && n !== reached(s) + 1) return false;
    p.push(cell);
    return true;
  }

  function solved(s) {
    return s.path.length === s.size * s.size && clueAt(s, s.path[s.path.length - 1]) === s.clues.length;
  }

  // Every way to finish a puzzle, stopping once `limit` are found. Paths are lists of square indexes (r * size + c).
  function solutions(size, clues, limit) {
    var n = size * size, last = clues.length, num = [], seen = [], cur = [], out = [];
    clues.forEach(function (c, i) { num[c[0] * size + c[1]] = i + 1; });
    (function walk(k, next) {
      if (out.length >= limit) return;
      seen[k] = true;
      cur.push(k);
      if (cur.length === n) {
        if (num[k] === last) out.push(cur.slice());
      } else if (num[k] !== last) {
        var r = (k / size) | 0, c = k % size;
        [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].forEach(function (p) {
          if (p[0] < 0 || p[1] < 0 || p[0] >= size || p[1] >= size) return;
          var j = p[0] * size + p[1];
          if (!seen[j] && (!num[j] || num[j] === next)) walk(j, num[j] ? next + 1 : next);
        });
      }
      seen[k] = false;
      cur.pop();
    })(clues[0][0] * size + clues[0][1], 2);
    return out;
  }

  // A new puzzle with exactly one solution: { clues, solution }.
  function generate(size, rand) {
    rand = rand || Math.random;
    var n = size * size, pick = function (a) { return a[Math.floor(rand() * a.length)]; };

    // 1. A random path through every square: start from a snake, then apply many
    //    "backbite" moves (join an end to a neighbour, cut the edge that would close a loop).
    var path = [];
    for (var r = 0; r < size; r++) for (var c = 0; c < size; c++) path.push([r, r % 2 ? size - 1 - c : c]);
    for (var t = 0; t < n * 60; t++) {
      if (rand() < 0.5) path.reverse();
      var end = path[n - 1];
      var near = [[end[0] + 1, end[1]], [end[0] - 1, end[1]], [end[0], end[1] + 1], [end[0], end[1] - 1]]
        .filter(function (p) { return p[0] >= 0 && p[1] >= 0 && p[0] < size && p[1] < size; });
      var v = pick(near);
      var j = path.findIndex(function (p) { return same(p, v); });
      if (j < n - 2) path = path.slice(0, j + 1).concat(path.slice(j + 1).reverse());
    }

    // 2. Number squares along it until no other path fits the numbers.
    var key = function (p) { return p.join(" "); };
    var flat = path.map(function (p) { return p[0] * size + p[1]; });
    var clueIdx = [0, n - 1];
    var cluesOf = function (idx) { return idx.slice().sort(function (a, b) { return a - b; }).map(function (i) { return path[i]; }); };
    var other = function (idx) {
      return solutions(size, cluesOf(idx), 2).find(function (s) { return key(s) !== key(flat); });
    };
    for (var alt = other(clueIdx); alt; alt = other(clueIdx)) {
      // Prefer a square where the other path disagrees; any unnumbered one guarantees progress.
      var free = flat.map(function (_, i) { return i; }).filter(function (i) { return clueIdx.indexOf(i) < 0; });
      var differs = free.filter(function (i) { return alt[i] !== flat[i]; });
      clueIdx.push(pick(differs.length ? differs : free));
    }

    // 3. Drop numbers the answer doesn't need, then add a few back so it stays friendly.
    clueIdx.slice(1).filter(function (i) { return i !== n - 1; })
      .sort(function () { return rand() - 0.5; })
      .forEach(function (i) {
        var without = clueIdx.filter(function (x) { return x !== i; });
        if (!other(without)) clueIdx = without;
      });
    while (clueIdx.length < 6) {
      var spare = flat.map(function (_, i) { return i; }).filter(function (i) { return clueIdx.indexOf(i) < 0; });
      clueIdx.push(pick(spare)); // extra numbers can't add solutions
    }

    return { clues: cluesOf(clueIdx), solution: path };
  }

  var api = { create: create, start: start, extend: extend, solved: solved, clueAt: clueAt, reached: reached, generate: generate, solutions: solutions };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.NumberLink = api;
})(this);
