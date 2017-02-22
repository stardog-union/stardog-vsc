const log = (...args) => {
  // TODO: how to detect debugging vs just running?
  console.log(...args);
};

const error = (...args) => {
  // TODO: how to detect debugging vs just running?
  console.error(...args);
};


module.exports = {
  log,
  error,
};
