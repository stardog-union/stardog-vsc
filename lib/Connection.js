const { Connection } = require('stardog');

let connection = null;

module.exports = {
  getConnection() {
    return connection;
  },
  setConnection(config) {
    connection = new Connection(config);
  }
};
