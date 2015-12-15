'use strict';

var afterAll = require('after-all');


module.exports = function (string, pattern, replacer, opts, cb) {
  if (typeof opts == 'function') {
    cb = opts;
    opts = {};
  }

  /*
   * Array containing match arrays.
   *
   * @example
   *   [
   *     ["one", 6, "begin one two end"],
   *     ["two", 10, "begin one two end"]
   *   ]
   */
  var matches = [];

  /*
   * Array containing matched substrings and contexts interspersed.
   *
   * @example
   *   ["begin ", "one", " ", "two", " end"]
   */
  var parts = [];

  // Size of consumed portion of the input string.
  var end = 0;

  string.replace(pattern, function (substring) {
    matches.push([].slice.call(arguments));

    var offset = arguments[arguments.length - 2];
    parts.push(string.slice(end, offset), substring);
    end = offset + substring.length;
  });
  parts.push(string.slice(end));

  process.nextTick(opts.parallel ? parallelLoop : sequentialLoop.bind(null, 0));

  function parallelLoop () {
    var callback = afterAll(function (err) {
      return err
        ? cb(err)
        : cb(null, parts.join(''));
    });

    matches.forEach(function (match, i) {
      replacer.apply(null, [callback(next)].concat(match));

      function next (err, replacement) {
        // `err` is processed by `callback`.
        parts[1 + 2 * i] = replacement;
      }
    });
  }

  function sequentialLoop (i) {
    if (matches.length <= i) {
      return cb(null, parts.join(''));
    }

    replacer.apply(null, [next].concat(matches[i]));

    function next (err, replacement) {
      if (err) return cb(err);

      parts[1 + 2 * i] = replacement;
      sequentialLoop(i + 1);
    }
  }
};
