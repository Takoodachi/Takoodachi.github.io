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

  var api = { create: create, start: start, extend: extend, solved: solved, clueAt: clueAt, reached: reached };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.NumberLink = api;
})(this);
