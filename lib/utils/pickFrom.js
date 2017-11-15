const toString = Object.prototype.toString;
const isObject = (candidate) => toString.call(candidate) === '[object Object]';

/**
 * Given an object and an array of keys, returns a new object with only the key-value pairs for
 * those keys. If no keys are passed, an empty object is returned. If no object is passed,
 * returns undefined.
 *
 * @param {Object} obj
 * @param {string[]} keys
 */
module.exports = function pickFrom(obj, keys = []) {
  if (!isObject(obj)) {
    return undefined;
  }

  // convert keys to a hash for quick lookup, but don't require a hash so API is nice
  const hash = keys.reduce((accumulator, key) => {
    accumulator[key] = true;
    return accumulator;
  }, {});

  return Object.keys(obj).filter((key) => hash[key]).reduce((accumulator, key) => {
    accumulator[key] = obj[key];
    return accumulator;
  }, {});
};
