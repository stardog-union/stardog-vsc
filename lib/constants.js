module.exports = Object.freeze({
  EXTENSION_PREFIX: 'stardog-vsc',
  CONFIGURATION_PREFIX: 'stardog',
  DEFAULT_ENDPOINT: 'http://localhost:5820',
  DEFAULT_USERNAME: 'admin',
  DEFAULT_PASSWORD: 'admin',
  CONNECTION_ESTABLISHED: 'CONNECTION_ESTABLISHED',
  PREFIX_RE: /^prefix\b/i,
  REGION_RE: /^#\s*region\b/i,
  ENDREGION_RE: /^#\s*endregion\b/i,
  WHITESPACE_LINE_RE: /^\s*$/
});
