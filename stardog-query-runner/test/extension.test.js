/* eslint-env node, mocha */

const expect = require('must');

// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
const { workspace, window, commands, languages } = require('vscode');
const { Connection } = require('stardog');
const extension = require('../extension');
const simple = require('simple-mock');

const { ResultProvider } = extension;


describe('stardog-query-runner extension', () => {
  const pluginContext = () => ({
    subscriptions: {
      push: simple.mock(),
    },
  });
  beforeEach(() => {
    simple.mock(commands, 'executeCommand').resolveWith(null);
  });
  afterEach(() => simple.restore());
  describe('validateSettings()', () => {
    it('returns a list of errors if there are no settings', () => {
      const errors = extension.validateSettings();
      expect(errors).to.have.length(4);
    });

    it('returns specific errors', () => {
      const errors = extension.validateSettings({
        password: '',
        endpoint: null,
        username: 'username',
        database: 'database',
      });
      expect(errors).to.have.length(2);
      expect(errors[0]).to.be('endpoint');
      expect(errors[1]).to.be('password');
    });

    it('returns null if there are no errors with the settings', () => {
      const errors = extension.validateSettings({
        password: 'password',
        endpoint: 'endpoint',
        username: 'username',
        database: 'database',
      });
      expect(errors).to.be.null();
    });
  });

  describe('buildConnection()', () => {
    it('builds a Stardog connection based on the supplied settings', () => {
      const result = extension.buildConnection({
        username: 'username',
        password: 'password',
        endpoint: 'endpoint',
      });

      expect(result).to.be.an.instanceOf(Connection);
    });

    it('gracefully handles empty config', () => {
      const result = extension.buildConnection();
      expect(result).to.be.null();
    });
  });

  describe('sendQuery()', () => {
    const dbQuery = 'SELECT DISTINCT ?s WHERE { ?s ?p ?o } LIMIT 10';
    it('does nothing if there is not an active textEditor', () => {
      const query = simple.mock();
      const conn = { query };
      const win = { activeTextEditor: null };

      extension.sendQuery(win, conn);
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

      expect(() => { extension.sendQuery(win, null); }).to.not.throw();
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

      extension.sendQuery(win, conn, 'myDB', {});
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

      extension.sendQuery(win, conn, 'myDB', {});
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

      extension.sendQuery(win, conn, 'myDB', {});
      expect(win.showErrorMessage.called).to.be.true();
    });
  });

  describe('init()', () => {
    it('shows an error message if there are issues with the settings', () => {
      const context = pluginContext();
      simple.mock(commands, 'registerCommand').returnWith(null);
      simple.mock(workspace, 'getConfiguration').returnWith(undefined);
      simple.mock(window, 'showErrorMessage').resolveWith(null);
      extension.init(context, new ResultProvider());
      expect(window.showErrorMessage.called).to.be.true();
    });

    it('wires up listeners for changes to the user settings', (done) => {
      const context = pluginContext();
      simple.mock(workspace, 'getConfiguration').returnWith(undefined);
      simple.mock(window, 'showErrorMessage').resolveWith(null);
      simple.mock(workspace, 'onDidChangeConfiguration').resolveWith(null);
      simple.mock(commands, 'registerCommand').returnWith(null);
      extension.init(context, new ResultProvider());
      setImmediate(() => {
        expect(workspace.onDidChangeConfiguration.called).to.be.true();
        done();
      });
    });

    it('shows the user settings if the user clicks the displayed button', (done) => {
      const context = pluginContext();
      simple.mock(commands, 'registerCommand').returnWith(null);
      simple.mock(workspace, 'getConfiguration').returnWith(undefined);
      simple.mock(window, 'showErrorMessage').resolveWith(true); // Simulate clicking one of the buttons
      simple.mock(workspace, 'onDidChangeConfiguration').returnWith(null);
      extension.init(context, new ResultProvider());
      setImmediate(() => {
        expect(commands.executeCommand.lastCall.args).to.eql(['workbench.action.openGlobalSettings']);
        done();
      });
    });

    it('registers commands even if there is an error', () => {
      const context = pluginContext();
      simple.mock(commands, 'registerCommand').returnWith(null);
      simple.mock(workspace, 'getConfiguration').returnWith(undefined);
      simple.mock(window, 'showErrorMessage').resolveWith(null);
      extension.init(context, new ResultProvider());
      expect(commands.registerCommand.callCount).to.be(2);
    });

    it('shows a pick list of databases', (done) => {
      const context = pluginContext();
      const pickItem = (label) => ({ label, description: '$(database)' });
      simple.mock(commands, 'registerCommand').returnWith({ dispose: () => { } });
      simple.mock(workspace, 'getConfiguration').returnWith({
        password: 'password',
        endpoint: 'endpoint',
        username: 'username',
        database: 'database',
      });
      simple.mock(Connection.prototype, 'listDBs').callbackWith({
        databases: ['1', '2', '3'],
      });
      simple.mock(window, 'showQuickPick').resolveWith('myDB');
      extension.init(context, new ResultProvider());

      setImmediate(() => {
        expect(window.showQuickPick.lastCall.args).to.eql([
          [pickItem('1'), pickItem('2'), pickItem('3')], {
            placeHolder: 'Select a target database',
            ignoreFocusOut: true,
          },
        ]);
        done();
      });
    });

    it('registers the command that will run queries', (done) => {
      const context = pluginContext();
      const disposeable = {
        dispose: simple.stub(),
      };

      simple.mock(commands, 'registerCommand').returnWith(disposeable);
      simple.mock(workspace, 'getConfiguration').returnWith({
        password: 'password',
        endpoint: 'endpoint',
        username: 'username',
        database: 'database',
      });
      simple.mock(Connection.prototype, 'listDBs').callbackWith({
        databases: ['1', '2', '3'],
      });
      simple.mock(window, 'showQuickPick').resolveWith('myDB');
      simple.mock(extension, 'sendQuery').returnWith(null);
      extension.init(context, new ResultProvider());

      setImmediate(() => {
        expect(disposeable.dispose.called).to.be.true();
        // Once for the stub, and again for the real command after the promise resolves.
        // times 2 for the two different commands exposed
        expect(commands.registerCommand.callCount).to.be(4);
        const [
          name,
          handler,
        ] = commands.registerCommand.calls[2].args;
        handler();
        expect(name).to.be('stardog-query-runner.sendQuery');
        expect(extension.sendQuery.called).to.be.true();
        done();
      });
    });

    it('registers the command that will init the plugin', (done) => {
      const context = pluginContext();
      const disposeable = {
        dispose: simple.stub(),
      };

      simple.mock(commands, 'registerCommand').returnWith(disposeable);
      simple.mock(workspace, 'getConfiguration').returnWith({
        password: 'password',
        endpoint: 'endpoint',
        username: 'username',
        database: 'database',
      });
      simple.mock(Connection.prototype, 'listDBs').callbackWith({
        databases: ['1', '2', '3'],
      });
      simple.mock(window, 'showQuickPick').resolveWith('myDB');
      simple.mock(extension, 'sendQuery').returnWith(null);
      simple.mock(extension, 'init');
      extension.init(context, new ResultProvider());

      setImmediate(() => {
        expect(disposeable.dispose.called).to.be.true();
        // Once for the stub, and again for the real command after the promise resolves.
        // times 2 for the two different commands exposed
        expect(commands.registerCommand.callCount).to.be(4);
        const [
          name,
          handler,
        ] = commands.registerCommand.calls[3].args;
        handler();
        expect(name).to.be('stardog-query-runner.pickDatabase');
        expect(extension.init.callCount).to.be(2);
        done();
      });
    });

    it('registers a CompletionItemProvider', (done) => {
      const context = pluginContext();
      const disposeable = {
        dispose: simple.stub(),
      };

      simple.mock(commands, 'registerCommand').returnWith(disposeable);
      simple.mock(workspace, 'getConfiguration').returnWith({
        password: 'password',
        endpoint: 'endpoint',
        username: 'username',
        database: 'database',
      });
      simple.mock(Connection.prototype, 'listDBs').callbackWith({
        databases: ['1', '2', '3'],
      });
      simple.mock(window, 'showQuickPick').resolveWith('myDB');
      simple.mock(extension, 'sendQuery').returnWith(null);
      simple.mock(languages, 'registerCompletionItemProvider').returnWith(null);
      extension.init(context, new ResultProvider());

      setImmediate(() => {
        expect(languages.registerCompletionItemProvider.called).to.be.true();
        done();
      });
    });
  });

  describe('activate()', () => {
    it('registers the result schema', () => {
      const context = pluginContext();
      simple.mock(workspace, 'registerTextDocumentContentProvider').returnWith(-1);
      simple.mock(extension, 'init').returnWith(null);

      extension.activate(context);
      const [
        schema,
        value,
      ] = workspace.registerTextDocumentContentProvider.lastCall.args;
      expect(schema).to.be('stardog-results');
      expect(value).to.be.a(ResultProvider);
      expect(extension.init.called).to.be.true();
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

    extension.sendQuery(win, conn, 'myDB', provider);
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

    extension.sendQuery(win, conn, 'myDB', provider);
    const args = commands.executeCommand.lastCall.args;
    expect(args[0]).to.be('vscode.previewHtml');
    expect(args[1].toString()).to.be('stardog-results://mydb/results');
  });
});
