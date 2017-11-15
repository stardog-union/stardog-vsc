// TODO: Better CSS.
const CSS = `
  table {
    width: 100%;
    border:0;
    border-spacing: 0px;
    border-collapse: collapse;
  }
  thead th {
    padding: 10px;
  }
  .vscode-dark table {
    color: #ffffff;
  }
  .vscode-dark tr:nth-child(odd) {
    background-color: #333333;
  }
  .vscode-dark tbody tr:hover {
    background-color: #e5e5e5
  }

  .vscode-light {
    color: #000000
  }
  .vscode-light tr:nth-child(odd) {
    background-color: #efefef;
  }
  .vscode-light tbody tr:hover {
    background-color: #e5e5e5
  }
`;

module.exports = class ResultProvider {
  constructor({ env }) {
    this.columns = [];
    this.values = [];

    /**
     * The below is some ceremony required for being able to trigger updates on this ResultProvider
     * without having to generate a unique URI for every result set. This is mostly undocumented,
     * but you can see Microsoft doing something like this here:
     * https://github.com/Microsoft/vscode-extension-samples/blob/master/previewhtml-sample/src/extension.ts
     *
     * What seems to be going on here is something like this:
     *
     * When a provider is registered with VSCode as a TextDocumentContentProvider for a given URL
     * scheme (i.e., 'stardog-vsc://', like with this ResultProvider), VSCode internally reads that
     * provider's `onDidChange` property, looking for an event type, and sets a change listener for
     * that event type. So, if you create your own EventEmitter, and assign its event type to the
     * provider's `onDidChange` property, VSCode will grab that event type and set a listener for it.
     * Then, when you want to trigger that event, you `fire` an event on the same EventEmitter and
     * VSCode will run the change listener, triggering a fresh call to `provideTextDocumentContent`.
     */
    this._onDidChange = new env.EventEmitter();
    this.onDidChange = this._onDidChange.event;
  }

  setData(columns, values) {
    Object.assign(this, { columns, values });
  }

  update(uri) {
    this._onDidChange.fire(uri);
  }

  provideTextDocumentContent() {
    const html = `
      <style>
        ${CSS}
      </style>
      <body>
        <table id="results">
          <thead>
            <tr>
              ${this.columns.map(c => `<th>${c}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${this.values.map(v =>
            `<tr>
                ${this.columns.map(c => `<td>${v[c] ? v[c].value : ''}</td>`).join('')}
            </tr>`).join('')}
          </tbody>
        </table>
      </body>
    `;

    return html;
  }
};
