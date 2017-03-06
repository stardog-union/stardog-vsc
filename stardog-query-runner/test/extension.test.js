/* eslint-env node, mocha */

const expect = require('must');

// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
const { workspace, window, commands } = require('vscode');
const { Connection } = require('stardog');
const extension = require('../extension');
const simple = require('simple-mock');

const {
  validateSettings,
  buildConnection,
  ResultProvider,
  activate,
  sendQuery,
  init,
} = extension;

describe('stardog-query-runner extension', () => {
  const pluginContext = () => ({
    subscriptions: {
      push: simple.mock(),
    },
  });
  afterEach(() => simple.restore());
  describe('validateSettings()', () => {
    it('returns a list of errors if there are no settings', () => {
      const errors = validateSettings();
      expect(errors).to.have.length(4);
    });

    it('returns specific errors', () => {
      const errors = validateSettings({
        password: '',
        endpoint: null,
        username: 'username',
        database: 'database',
      });
      expect(errors).to.have.length(2);
      expect(errors[0]).to.equal('endpoint');
      expect(errors[1]).to.equal('password');
    });

    it('returns null if there are no errors with the settings', () => {
      const errors = validateSettings({
        password: 'password',
        endpoint: 'endpoint',
        username: 'username',
        database: 'database',
      });
      expect(errors).to.be.null();
    });
  });
  describe('buildConnection', () => {
    it('builds a Stardog connection based on the supplied settings', () => {
      const result = buildConnection({
        username: 'username',
        password: 'password',
        endpoint: 'endpoint',
      });

      expect(result).to.be.an.instanceOf(Connection);
    });

    it('gracefully handles empty config', () => {
      const result = buildConnection();
      expect(result).to.be.null();
    });
  });
  describe('sendQuery()', () => {
    const dbQuery = 'SELECT DISTINCT ?s WHERE { ?s ?p ?o } LIMIT 10';
    it('does nothing if there is not an active textEditor', () => {
      const query = simple.mock();
      const conn = { query };
      const win = { activeTextEditor: null };

      sendQuery(win, conn);
      expect(query.called).to.be.false();
    });

    it('does nothing if there is not an active connection', () => {
      const win = {
        activeTextEditor: {
          document: {
            getText: simple.mock(),
          },
        },
      };

      expect(() => { sendQuery(win, null); }).to.not.throw();
      expect(win.activeTextEditor.document.getText.called).to.be.false();
    });

    it('sends the entire text context if there is not any selected text', () => {
      const query = simple.mock();
      const conn = { query };
      const win = {
        activeTextEditor: {
          document: {
            getText: simple.mock().returnWith(dbQuery),
          },
          selection: {
            isEmpty: true,
          },
        },
      };

      sendQuery(win, conn, 'myDB', {});
      expect(query.called).to.be.true();
      expect(win.activeTextEditor.document.getText.lastCall.args).to.eql([undefined]);
      expect(query.lastCall.args[0]).to.eql({
        query: dbQuery,
        database: 'myDB',
      });
    });

    it('sends the highlighted text is there is any', () => {
      const query = simple.mock();
      const conn = { query };
      const selection = {
        isEmpty: false,
        start: 0,
        end: 10,
      };
      const win = {
        activeTextEditor: {
          document: {
            getText: simple.mock().returnWith(dbQuery.slice(selection.start, selection.end)),
          },
          selection,
        },
      };

      sendQuery(win, conn, 'myDB', {});
      expect(query.called).to.be.true();
      expect(win.activeTextEditor.document.getText.lastCall.args).to.eql([selection]);
      expect(query.lastCall.args[0]).to.eql({
        query: dbQuery.slice(selection.start, selection.end),
        database: 'myDB',
      });
    });

    it('shows an error if there is one', () => {
      const query = simple.mock().callbackWith(null);
      const conn = { query };
      const win = {
        activeTextEditor: {
          document: {
            getText: simple.mock(),
          },
          selection: {},
        },
        showErrorMessage: simple.mock(),
      };

      sendQuery(win, conn, 'myDB', {});
      expect(win.showErrorMessage.called).to.be.true();
    });
  });

  it('sets provider values on success', () => {
    const query = simple.mock().callbackWith({
      head: {
        vars: ['s', 'o', 'p'],
      },
      results: {
        bindings: [1, 2, 3],
      },
    });
    const conn = { query };
    const win = {
      activeTextEditor: {
        document: {
          getText: simple.mock(),
        },
        selection: {},
      },
      showErrorMessage: simple.mock(),
    };

    const provider = new ResultProvider();
    simple.mock(provider, 'setData');


    // Do this to prevent errors during this test
    simple.mock(commands, 'executeCommand').resolveWith(null);

    sendQuery(win, conn, 'myDB', provider);
    expect(provider.setData.called).to.be.true();
    expect(provider.columns).to.eql(['s', 'o', 'p']);
    expect(provider.values).to.eql([1, 2, 3]);
  });

  it('calls the previewHtml command', () => {
    const query = simple.mock().callbackWith({
      head: {
        vars: ['s', 'o', 'p'],
      },
      results: {
        bindings: [1, 2, 3],
      },
    });
    const conn = { query };
    const win = {
      activeTextEditor: {
        document: {
          getText: simple.mock(),
        },
        selection: {},
      },
      showErrorMessage: simple.mock(),
    };
    const provider = new ResultProvider();

    simple.mock(commands, 'executeCommand').resolveWith(null);
    sendQuery(win, conn, 'myDB', provider);
    const args = commands.executeCommand.lastCall.args;
    expect(args[0]).to.equal('vscode.previewHtml');
    expect(args[1].toString()).to.equal('stardog-results://mydb/results');
  });

  describe('init()', () => {
    it('shows an error message if there are issues with the settings', () => {
      const context = pluginContext();
      simple.mock(commands, 'registerCommand').returnWith(undefined);
      simple.mock(workspace, 'getConfiguration').returnWith(undefined);
      simple.mock(window, 'showErrorMessage').resolveWith(null);
      init(context, new ResultProvider());
      expect(window.showErrorMessage.called).to.be.true();
    });

    it('wires up listeners for changes to the user settings', (done) => {
      const context = pluginContext();
      simple.mock(workspace, 'getConfiguration').returnWith(undefined);
      simple.mock(window, 'showErrorMessage').resolveWith(null);
      simple.mock(workspace, 'onDidChangeConfiguration').resolveWith(null);
      simple.mock(commands, 'registerCommand').returnWith(undefined);
      init(context, new ResultProvider());
      setImmediate(() => {
        expect(workspace.onDidChangeConfiguration.called).to.be.true();
        done();
      });
    });

    it('shows the user settings if the user clicks the displayed button', (done) => {
      const context = pluginContext();
      simple.mock(commands, 'registerCommand').returnWith(undefined);
      simple.mock(workspace, 'getConfiguration').returnWith(undefined);
      simple.mock(window, 'showErrorMessage').resolveWith(true); // Simulate clicking one of the buttons
      simple.mock(workspace, 'onDidChangeConfiguration').returnWith(null);
      simple.mock(commands, 'executeCommand').returnWith(undefined);
      init(context, new ResultProvider());
      setImmediate(() => {
        expect(commands.executeCommand.lastCall.args).to.eql(['workbench.action.openGlobalSettings']);
        done();
      });
    });

    it('creates the command even if there is an error', () => {
      const context = pluginContext();
      simple.mock(commands, 'registerCommand').returnWith(undefined);
      simple.mock(workspace, 'getConfiguration').returnWith(undefined);
      simple.mock(window, 'showErrorMessage').resolveWith(null);
      init(context, new ResultProvider());
      expect(commands.registerCommand.lastCall.args[0]).to.eql('stardog-query-runner.sendQuery');
      expect(context.subscriptions.push.called).to.be.true();
    });

    it('creates the command that will call sendQuery', () => {
      const context = pluginContext();
      simple.mock(commands, 'registerCommand').returnWith(undefined);
      simple.mock(workspace, 'getConfiguration').returnWith({
        password: 'password',
        endpoint: 'endpoint',
        username: 'username',
        database: 'database',
      });
      simple.mock(extension, 'sendQuery').returnWith(undefined);
      init(context, new ResultProvider());
      expect(commands.registerCommand.lastCall.args[0]).to.eql('stardog-query-runner.sendQuery');
      const onSendQuery = commands.registerCommand.lastCall.args[1];
      onSendQuery();
      expect(extension.sendQuery.called).to.be.true();
      expect(extension.sendQuery.lastCall.args).to.have.length(4);
      expect(context.subscriptions.push.called).to.be.true();
    });
  });

  describe('activate()', () => {
    it('registers the result schema', () => {
      const context = pluginContext();
      simple.mock(workspace, 'registerTextDocumentContentProvider').returnWith(-1);
      simple.mock(extension, 'init').returnWith(undefined);

      activate(context);
      const [
        schema,
        value,
      ] = workspace.registerTextDocumentContentProvider.lastCall.args;
      expect(schema).to.equal('stardog-results');
      expect(value).to.be.a(ResultProvider);
      expect(extension.init.called).to.be.true();
    });
  });
});
