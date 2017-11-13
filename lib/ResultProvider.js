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
  constructor() {
    this.columns = null;
    this.values = null;
  }

  setData(columns, values) {
    Object.assign(this, { columns, values });
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
