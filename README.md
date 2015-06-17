[![npm](https://nodei.co/npm/string-replace.png)](https://nodei.co/npm/string-replace/)

# string-replace

[![Build Status][travis-badge]][travis] [![Dependency Status][david-badge]][david]

Asynchronous version of [String.prototype.replace].

[String.prototype.replace]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace

[travis]: https://travis-ci.org/eush77/string-replace
[travis-badge]: https://travis-ci.org/eush77/string-replace.svg
[david]: https://david-dm.org/eush77/string-replace
[david-badge]: https://david-dm.org/eush77/string-replace.png

## Example

```js
stringReplace('name: {name}, value: {value}', /\{([^}]+)\}/g, replace,
              function done(result) {
  console.log(result);
});

function replace(cb, match, key) {
  // Do some async stuff here.
  // Arguments to this function are almost the same as for String.prototype.replace.
  // Except for the callback.
  // ...
  cb(value);
}
```

## API

### `stringReplace(string, pattern, replacer(cb, match, ...), cb(result))`

Applies [String.prototype.replace] asynchronously.

Replaces all occurences of `pattern` (regexp or string) in a `string` with invocations of `replacer` function. Functionally equivalent to `string.replace(pattern, replacer(match, ...))` but `replacer` has to return value by calling `cb`.


## Install

```
npm install string-replace
```

## License

MIT
