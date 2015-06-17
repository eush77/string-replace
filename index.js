'use strict';

var afterAll = require('after-all');


module.exports = function (string, pattern, replacer, opts, cb) {
  if (typeof opts == 'function') {
    cb = opts;
    opts = {};
  }

  var matches = [];
  var end = 0;

  string.replace(pattern, function (substring) {
    var offset = arguments[arguments.length - 2];
    matches.push(string.slice(end, offset), [].slice.call(arguments));
    end = offset + substring.length;
  });

  matches.push(string.slice(end));

  var loop = opts.parallel
        ? function () {
          var callback = afterAll(function () {
            cb(matches.join(''));
          });

          for (var i = 1; i < matches.length; i += 2) {
            (function (i) {
              replacer.apply(null, [callback(next)].concat(matches[i]));

              function next(replacement) {
                matches[i] = replacement;
              }
            }(i));
          }
        }
      : function loop(i) {
        if (matches.length <= i) {
          return cb(matches.join(''));
        }

        replacer.apply(null, [next].concat(matches[i]));

        function next(replacement) {
          matches[i] = replacement;
          loop(i + 2);
        }
      }.bind(null, 1);

  process.nextTick(loop);
};
