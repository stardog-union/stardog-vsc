/* eslint-env node, mocha */


// The module 'assert' provides assertion methods from node
const expect = require('must');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require('vscode');
const { Connection } = require('stardog');
const { validateSettings, buildConnection, sendQuery } = require('../extension');
const simple = require('simple-mock');

describe('stardog-query-runner extension', () => {
  describe('validateSettings()', () => {
    it('returns a list of errors if there are no settings', function() {
      const errors = validateSettings();
      expect(errors).to.have.length(4);
    });

    it('returns specific errors', function () {
      const errors = validateSettings({
        password: '',
        endpoint: null,
        username: 'username',
        database: 'database'
      });
      expect(errors).to.have.length(2);
      expect(errors[0]).to.equal('endpoint');
      expect(errors[1]).to.equal('password');
    });

    it('returns null if there are no errors with the settings', function() {
      const errors = validateSettings({
        password: 'password',
        endpoint: 'endpoint',
        username: 'username',
        database: 'database'
      });
      expect(errors).to.be.null();
    });
  });
  describe('buildConnection', () => {
    it('builds a Stardog connection based on the supplied settings', () => {
      const result = buildConnection({
        username: 'username',
        password: 'password',
        endpoint: 'endpoint'
      });

      expect(result).to.be.an.instanceOf(Connection);
    });

    it('gracefully handles empty config', () => {
      const result = buildConnection();
      expect(result).to.be.null();
    });
  });
  describe('sendQuery()', () => {
    it('does nothing if there is not an active textEditor', () => {
      const query = simple.spy();
      const conn = { query };
      const win = { activeTextEditor: null }

      sendQuery(win, conn);
      expect(query.called).to.be.false();
    });

    it('does nothing if there is not an active connection', () => {
      const win = { 
        activeTextEditor: { 
          document: {
            getText: simple.spy() 
          }
        }
      };

      expect(() => { sendQuery(win, null); }).to.not.throw();
      expect(win.activeTextEditor.document.getText.called).to.be.false();
    });

    it('sends the query from the window object', () => {
      const dbQuery = 'SELECT DISTINCT ?s WHERE { ?s ?p ?o } LIMIT 10';
      const query = simple.spy();
      const conn = { query };
      const win = { 
        activeTextEditor: { 
          document: {
            getText: simple.stub().returnWith(dbQuery)
          }
        }
      }

      sendQuery(win, conn, 'myDB');
      expect(query.called).to.be.true();
      expect(query.lastCall.args[0]).to.eql({
        query: dbQuery,
        database: 'myDB'
      });
    });
  });
});