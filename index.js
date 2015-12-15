'use strict';

var afterAll = require('after-all');


module.exports = function (string, pattern, replacer, opts, cb) {
  if (typeof opts == 'function') {
    cb = opts;
    opts = {};
  }

  /*
   * Array containing match arrays interspersed with string contexts.
   *
   * @example
   *   [
   *     "begin ",
   *     ["one", 6, "begin one two end"],
   *     " ",
   *     ["two", 10, "begin one two end"],
   *     " end"
   *   ]
   */
  var matches = [];

  // Size of consumed portion of the input string.
  var end = 0;

  string.replace(pattern, function (substring) {
    var offset = arguments[arguments.length - 2];
    matches.push(string.slice(end, offset), [].slice.call(arguments));
    end = offset + substring.length;
  });
  matches.push(string.slice(end));

  process.nextTick(opts.parallel ? parallelLoop : sequentialLoop.bind(null, 1));

  function parallelLoop () {
    var callback = afterAll(function (err) {
      return err
        ? cb(err)
        : cb(null, matches.join(''));
    });

    for (var i = 1; i < matches.length; i += 2) {
      (function (i) {
        replacer.apply(null, [callback(next)].concat(matches[i]));

        function next (err, replacement) {
          // `err` is processed by `callback`.
          matches[i] = replacement;
        }
      }(i));
    }
  }

  function sequentialLoop (i) {
    if (matches.length <= i) {
      return cb(null, matches.join(''));
    }

    replacer.apply(null, [next].concat(matches[i]));

    function next (err, replacement) {
      if (err) return cb(err);
      matches[i] = replacement;
      sequentialLoop(i + 2);
    }
  }
};
