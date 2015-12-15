'use strict';

var stringReplace = require('..');

var test = require('tape');


var spinner = (function () {
  var states = '/-\\|';
  return function (state) {
    var i = states.indexOf(state);
    var di = 1;
    return function (cb, m) {
      if (/[^ ]/.test(m)) {
        di = -di;
      }
      var char = states[(i + states.length) % states.length];
      i += di;
      cb(null, char);
    };
  };
}());


test('global replace', function (t) {
  stringReplace('....  ... ...   ...  ..', /\s+/g, spinner('/'),
                function (err, result) {
                  t.error(err);
                  t.equal(result, '..../...-...\\...|..');
                  t.end();
                });
});


test('non-global replace', function (t) {
  stringReplace('....  ... ...  ....', ' ', spinner('|'),
                function (err, result) {
                  t.error(err);
                  t.equal(result, '....| ... ...  ....');
                  t.end();
                });
});


test('groups', function (t) {
  stringReplace('. . .\t. .\t. . . .', /\s/g, spinner('/'),
                function (err, result) {
                  t.error(err);
                  t.equal(result, './.-.\\.-./.-.\\.|.');
                  t.end();
                });
});


test('next-tick business', function (t) {
  var count = 0;

  stringReplace(' ', /\s/g, inc, function (err) {
    t.error(err);
    t.equal(count, 1);
    t.end();
  });

  t.equal(count, 0);

  function inc(cb) {
    count += 1;
    cb();
  }
});


test('intermediate results when sequencing', function (t) {
  stringReplace('foo bar baz\n', /\w{3}/g, replace, function (err, result) {
    t.error(err);
    t.equal(result, 'abc def ghi\n');
    t.end();
  });

  var next = [
    function (cb, foo, index, result) {
      t.equal(index, 0, 'first index');
      t.equal(result, 'foo bar baz\n', 'first result');
      cb(null, 'abc');
    },
    function (cb, bar, index, result) {
      t.equal(index, 4, 'second index');
      t.equal(result, 'abc bar baz\n', 'second result');
      cb(null, 'def');
    },
    function (cb, baz, index, result) {
      t.equal(index, 8, 'third index');
      t.equal(result, 'abc def baz\n', 'third result');
      cb(null, 'ghi');
    }
  ];

  function replace() {
    next.shift().apply(this, arguments);
  }
});


test('sequence rule', function (t) {
  var count = 0;

  stringReplace('. . . .', /\s/g, next, function (err) {
    t.error(err);
    t.equal(count, 3, 3);
    t.end();
  });

  function next(cb) {
    var state = count;
    process.nextTick(function () {
      t.equal(count, state, String(state));
      setImmediate(function () {
        t.equal(count, state, (state * 3 + 1) + '/3');
        setTimeout(function () {
          t.equal(count, state, (state * 3 + 2) + '/3');
          count += 1;
          cb();
        }, 0x20);
      });
    });
  }
});


test('parallel rule', function (t) {
  var time = 0;
  var callbacks = [];

  stringReplace('. . . .', /\s/g, next, { parallel: true }, function (err) {
    t.error(err);
    t.equal(++time, 4, 'finish');
    t.end();
  });

  function next(cb, match, index) {
    callbacks.push(cb);
    t.equal(++time, callbacks.length,
            'match found (' + JSON.stringify(match) + ', index=' + index + ')');

    if (callbacks.length == 3) {
      callbacks.forEach(function (cb) {
        cb();
      });
    }
  }
});


test('errors', function (t) {
  var time;

  t.test('sequence', function (t) {
    time = 0;
    stringReplace('. . . .', /\s/g, next, function (err) {
      t.ok(err, 'error caught in sequence');
      t.equal(time, 2, 'replacing stopped after the first error');
      t.end();
    });
  });

  t.test('parallel', function (t) {
    time = 0;
    stringReplace('. . . .', /\s/g, next, { parallel: true }, function (err) {
      t.ok(err, 'error caught in parallel');
      t.equal(time, 3, 'other callbacks continued running in parallel');
      t.end();
    });
  });

  function next(cb) {
    if (!time) {
      process.nextTick(cb.bind(null, null, ''));
    }
    else {
      process.nextTick(cb.bind(null, Error()));
    }
    ++time;
  }
});
