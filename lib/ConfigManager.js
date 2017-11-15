const { db, Connection } = require('stardog');

const pickFrom = require('./utils/pickFrom');
const isObject = require('./utils/isObject');
const isNonEmptyString = require('./utils/isNonEmptyString');
const {
  CONFIGURATION_PREFIX,
  DEFAULT_ENDPOINT,
  DEFAULT_USERNAME,
  DEFAULT_PASSWORD,
  CONNECTION_ESTABLISHED
} = require('./constants');

const configKeys = ['username', 'password', 'endpoint'];

const endpointInputConfig = {
  placeholder: DEFAULT_ENDPOINT,
  prompt: `Enter the endpoint URI for the Stardog server (default: ${DEFAULT_ENDPOINT})`
};
const usernameInputConfig = {
  placeholder: DEFAULT_USERNAME,
  prompt: `Enter your username (default: ${DEFAULT_USERNAME})`
};
const passwordInputConfig = {
  password: true,
  placeholder: '********',
  prompt: `Enter your password (default: ${DEFAULT_PASSWORD})`
};

// TODO: Consider whether we want all of this encapsulated in a class, or just want to break out
// command functions into separate modules.
module.exports = class ConfigManager {
  constructor({ env, configuration }) {
    if (!env) {
      throw new Error('Cannot create a ConfigManager instance without an environment.');
    }

    const { window, workspace, commands } = env;

    if (!window || !workspace) {
      throw new Error('Cannot create a ConfigManager instance without a window, workspace, or commands namespace.');
    }

    this._window = window;
    this._workspace = workspace;
    this._commands = commands;
    this._configuration = this.validateConfiguration(configuration) ? configuration : null;
    this._connection = null;
    this._database = null;
  }

  // DRY utility for breaking promise chains when an input box is canceled
  _returnOrThrow(value, defaultValue) {
    if (value === undefined) {
      throw new Error('ESC');
    }
    return value || defaultValue; // `value` could be an empty string if user hits ENTER
  }

  _resolveEndpoint(newConfig) {
    return this._window.showInputBox(endpointInputConfig)
      .then((endpoint) => this._returnOrThrow(endpoint, DEFAULT_ENDPOINT));
  }

  _resolveUsername() {
    return this._window.showInputBox(usernameInputConfig)
      .then((username) => this._returnOrThrow(username, DEFAULT_USERNAME));
  }

  _resolvePassword() {
    return this._window.showInputBox(passwordInputConfig)
      .then((password) => this._returnOrThrow(password, DEFAULT_PASSWORD));
  }

  validateConfiguration(config) {
    return isObject(config) && configKeys.every((key) => isNonEmptyString(config[key]));
  }

  getConfiguration() {
    return this._configuration;
  }

  setConfigurationFromUser() {
    const newConfig = {}; // configuration accumulator

    return this._resolveEndpoint()
      .then((endpoint) => newConfig.endpoint = endpoint)
      .then(() => this._resolveUsername())
      .then((username) => newConfig.username = username)
      .then(() => this._resolvePassword())
      .then((password) => newConfig.password = password)
      .then(() => {
        if (!this.validateConfiguration(newConfig)) {
          // If config doesn't look good, notify, and recursively re-run this method.
          return this._window.showInformationMessage(
            'Sorry, but something about those values didn\'t look right. Let\'s try again.'
          ).then(() => this.setConfigurationFromUser());
        }

        // Store the configuration settings and return them.
        // Sucks that you have to update configuration for each discrete value like this,
        // but that does appear to be the case.
        const workspaceConfig = this._workspace.getConfiguration(CONFIGURATION_PREFIX);
        Object.keys(newConfig).forEach((key) => workspaceConfig.update(key, newConfig[key]));
        this._configuration = newConfig;

        return newConfig;
      })
      .then(undefined, (err) => {
        if (err) {
          if (err.message === 'ESC') {
            return; // user hit ESC to break the chain; just swallow the "error"
          }
          this._window.showErrorMessage(err.message);
        }
      });
  }

  setConfiguration(candidateConfig) {
    if (this.validateConfiguration(candidateConfig)) {
      this._configuration = candidateConfig;
    }
    else {
      const storedConfiguration = pickFrom(
        this._workspace.getConfiguration(CONFIGURATION_PREFIX),
        configKeys
      );

      if (this.validateConfiguration(storedConfiguration)) {
        this._configuration = storedConfiguration;
      }
    }

    // Check whether we've got a usable config. Otherwise, request relevant data from user.
    if (this._configuration) {
      return Promise.resolve(this._configuration);
    }

    return this.setConfigurationFromUser();
  }

  getConnection() {
    return this._connection;
  }

  setConnection() {
    this._commands.executeCommand('setContext', CONNECTION_ESTABLISHED, false);

    if (this._configuration) {
      this._connection = new Connection(this._configuration);
      this._commands.executeCommand('setContext', CONNECTION_ESTABLISHED, true);
      return Promise.resolve(this._connection);
    }

    return this.setConfiguration().then(() => this.setConnection());
  }

  getDatabase() {
    return this._database;
  }

  setDatabaseFromUser() {
    return db.list(this._connection).then(({ body }) => {
      const { databases } = body;

      if (!databases || databases.length === 0) {
        // TODO: Decide what to do here.
        return;
      }

      const pickableDbs = databases.map((dbName) => ({ label: dbName, description: '$(database)'}));

      return this._window.showQuickPick(pickableDbs, {
        placeholder: 'Select a target database',
      }).then((selectedDb) => {
        if (!selectedDb) { // can happen if user hits ESC
          throw new Error(
            'No database selected. In order to execute a query, you must select a database!'
          );
        }

        // Store the chosen database identifier and return it.
        const { label } = selectedDb;
        this._workspace.getConfiguration(CONFIGURATION_PREFIX).update('database', label);
        this._database = label;

        return label;
      });
    });
  }

  setDatabase(database) {
    if (database) {
      this._database = database;
    }
    else {
      const storedDatabase = this._workspace.getConfiguration(CONFIGURATION_PREFIX).get('database');

      if (storedDatabase) {
        this._database = storedDatabase;
      }
    }

    if (this._database) {
      return Promise.resolve(this._database);
    }

    if (!this._connection) {
      return this.setConnection().then(() => this.setDatabase(database));
    }

    return this.setDatabaseFromUser().then(undefined, (err) => this._window.showErrorMessage(err));
  }
}
