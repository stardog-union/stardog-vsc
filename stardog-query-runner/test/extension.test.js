/* eslint-env node, mocha */


// The module 'assert' provides assertion methods from node
const expect = require('must');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require('vscode');
const ext = require('../extension');

// Defines a Mocha test suite to group tests of similar kind together
describe('stardog-query-runner extension', function() {
  // Defines a Mocha unit test
  describe('validateSettings()', function() {
    it('returns a list of errors if there are no settings', function() {
      const errors = ext.validateSettings();
      expect(errors).to.have.length(3);
    });

    it('returns specific errors', function () {
      const errors = ext.validateSettings({
        password: '',
        endpoint: null,
        username: 'username'
      });
      expect(errors).to.have.length(2);
      expect(errors[0]).to.equal('endpoint');
      expect(errors[1]).to.equal('password');
    });

    it('returns null if there are no errors with the settings', function() {
      const errors = ext.validateSettings({
        password: 'password',
        endpoint: 'endpoint',
        username: 'username'
      });
      expect(errors).to.be.null();
    });
  });
});