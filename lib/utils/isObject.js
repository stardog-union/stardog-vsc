const toString = Object.prototype.toString;

// "Good enough" check for our purposes here.
module.exports = (candidate) => toString.call(candidate) === '[object Object]';
