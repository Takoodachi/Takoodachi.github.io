/* Number Link rules, kept free of the DOM so tests can run them in Node.
   A path starts on a number, moves one square at a time, may not enter another
   number, and cuts any path it crosses. The puzzle is solved when every pair is
   joined and every square is used. */
(function (root) {
  "use strict";

  var same = function (a, b) { return a[0] === b[0] && a[1] === b[1]; };
  var adjacent = function (a, b) { return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1; };

  function create(size, ends) {
    return { size: size, ends: ends, paths: {}, active: 0 };
  }

  function endAt(s, cell) {
    for (var n in s.ends) {
      if (s.ends[n].some(function (e) { return same(e, cell); })) return +n;
    }
    return 0;
  }

  function ownerOf(s, cell) {
    for (var n in s.paths) {
      var i = s.paths[n].findIndex(function (c) { return same(c, cell); });
      if (i >= 0) return { n: +n, i: i };
    }
    return null;
  }

  function isJoined(s, n) {
    n = +n; // object keys arrive as strings
    var p = s.paths[n];
    return !!p && p.length > 1 && endAt(s, p[0]) === n && endAt(s, p[p.length - 1]) === n;
  }

  // Pointer down: start fresh from a number, or pick up an existing path where it was touched.
  function start(s, cell) {
    var e = endAt(s, cell);
    if (e) { s.paths[e] = [cell]; s.active = e; return true; }
    var o = ownerOf(s, cell);
    if (o) { s.paths[o.n] = s.paths[o.n].slice(0, o.i + 1); s.active = o.n; return true; }
    s.active = 0;
    return false;
  }

  // Pointer moves onto a neighbouring square.
  function extend(s, cell) {
    var n = s.active;
    if (!n) return false;
    var path = s.paths[n];
    var last = path[path.length - 1];
    if (!adjacent(last, cell)) return false;

    var back = path.findIndex(function (c) { return same(c, cell); });
    if (back >= 0) { s.paths[n] = path.slice(0, back + 1); return true; }
    if (isJoined(s, n)) return false;

    var e = endAt(s, cell);
    if (e && e !== n) return false;

    var o = ownerOf(s, cell);
    if (o) s.paths[o.n] = s.paths[o.n].slice(0, o.i);
    path.push(cell);
    return true;
  }

  function filled(s) {
    var seen = {};
    for (var n in s.ends) s.ends[n].forEach(function (c) { seen[c] = 1; });
    for (var m in s.paths) s.paths[m].forEach(function (c) { seen[c] = 1; });
    return Object.keys(seen).length;
  }

  function solved(s) {
    for (var n in s.ends) if (!isJoined(s, n)) return false;
    return filled(s) === s.size * s.size;
  }

  var api = { create: create, start: start, extend: extend, isJoined: isJoined, filled: filled, solved: solved, endAt: endAt, ownerOf: ownerOf };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.NumberLink = api;
})(this);
