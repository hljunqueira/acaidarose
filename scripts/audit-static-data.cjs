// Read-only source audit. Does not load environment files or connect to services.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = process.cwd();
const output = path.join(root, 'docs/audits/2026-11-18');
const roots = ['app', 'components', 'lib', 'hooks', 'types', 'config', 'prisma', 'supabase', 'scripts', 'tools', 'mobile'];
const excluded = new Set(['node_modules', 'bin', 'obj', 'build', 'dist', '.next', '.git', 'esbocos']);
const files = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (excluded.has(entry.name) || entry.name.startsWith('.env')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?|cjs|mjs|sql|prisma|cs|conf)$/.test(entry.name) && !entry.name.startsWith('audit-')) files.push(full);
  }
}
roots.forEach(walk);
const relative = file => path.relative(root, file).replaceAll('\\', '/');
const routes = files.filter(f => /app[\\/]api[\\/].*[\\/]route\.ts$/.test(f)).map(file => {
  const endpoint = '/' + relative(file).replace(/^app\//, '').replace(/\/route\.ts$/, '');
  const text = fs.readFileSync(file, 'utf8');
  const methods = [...text.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS)\b/g)].map(m => m[1]);
  return { file: relative(file), endpoint, methods: methods.join('|') };
});
const candidates = [], apiReferences = [], tableReferences = [];
function collectSql(value, file, baseLine) {
  if (!/\b(?:SELECT\s|INSERT\s+INTO|UPDATE\s+[a-z_]+\s+SET|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE)/i.test(value)) return;
  for (const match of value.matchAll(/\b(FROM|JOIN|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?|ALTER\s+TABLE)\s+(?:public\.)?["`]?([a-z_][a-z_0-9]*)/gi)) {
    const table = match[2].toLowerCase();
    if (['set', 'of', 'the', 'a', 'this', 'to', 'if', 'as', 'select', 'on', 'o', 'information_schema', 'jsonb_array_elements', 'jsonb_array_elements_text'].includes(table)) continue;
    tableReferences.push({ file, line: baseLine + value.slice(0, match.index).split('\n').length - 1, operation: match[1].toUpperCase(), table, tier: tier(file) });
  }
}
function tier(file) { return /^(scripts|supabase|prisma)\//.test(file) ? 'script-or-schema' : file.startsWith('tools/') ? 'external-agent' : 'runtime'; }
function add(file, line, symbol, signal, review = 'REVIEW') {
  candidates.push({ file, line, symbol: symbol.slice(0, 100), signal, tier: tier(file), review });
}
const signals = [
  ['BUSINESS_LITERAL', /\b(?:precoBase|precoExtra|priceTierLow|priceTierHigh|limiteBases|limiteCremes|limiteFrutas|limiteToppings|discountedPrice|originalPrice|vatTotal|bagFee|commissionRate|royaltyRate)\b/],
  ['FIXED_TENANT', /11111111-1111|22222222-2222|33333333-3333|tenant-torres|TENANT_NAME_MAP|STORE_SLUGS|STORE_LABELS|FIGUEIRA_HQ_ID|AVEIRO_HQ_ID|TORRES_NOVAS_ID/],
  ['NAMED_INITIAL_OR_MOCK', /\b(?:INITIAL_[A-Z_]+|DEFAULT_[A-Z_]+|MOCK_[A-Z_]+|mockData|mockRequestId|initialData|initialState|defaultValues)\b/],
  ['LOCAL_PERSISTENCE', /\b(?:localStorage|sessionStorage)\b|\bpersist\s*\(/],
  ['RUNTIME_DDL_OR_SEED', /CREATE\s+TABLE|ALTER\s+TABLE|ensureTableAndSeed|seedDefault/i],
];
for (const file of files) {
  const name = relative(file), text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/^\s*(\/\/|\*|--)/.test(line)) return;
    for (const [signal, re] of signals) if (re.test(line)) add(name, index + 1, '', signal);
  });
  if (!/\.(tsx?|jsx?|cjs|mjs)$/.test(name)) {
    if (name.endsWith('.sql')) collectSql(text, name, 1);
    continue;
  }
  const sf = ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true, name.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const loc = node => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.initializer) {
      const init = node.initializer;
      if ((ts.isArrayLiteralExpression(init) && init.elements.length) || (ts.isObjectLiteralExpression(init) && init.properties.length)) {
        add(name, loc(node), node.name.getText(sf), 'NONEMPTY_LITERAL_INITIALIZER');
      }
    }
    if (ts.isBinaryExpression(node) && [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(node.operatorToken.kind)) {
      const rhs = node.right;
      if (ts.isStringLiteral(rhs) || ts.isNumericLiteral(rhs) || ts.isArrayLiteralExpression(rhs) || ts.isObjectLiteralExpression(rhs) || rhs.kind === ts.SyntaxKind.TrueKeyword || rhs.kind === ts.SyntaxKind.FalseKeyword) {
        add(name, loc(node), '', 'LITERAL_FALLBACK', (ts.isStringLiteral(rhs) && !rhs.text) || (ts.isArrayLiteralExpression(rhs) && !rhs.elements.length) ? 'EMPTY_STATE_REVIEW' : 'REVIEW');
      }
    }
    if ((ts.isParameter(node) || ts.isBindingElement(node) || ts.isPropertyAssignment(node)) && node.initializer) {
      const init = node.initializer;
      if (ts.isStringLiteral(init) || ts.isNumericLiteral(init) || ts.isArrayLiteralExpression(init) || ts.isObjectLiteralExpression(init)) add(name, loc(node), node.name?.getText(sf) || '', 'DEFAULT_OR_LITERAL_PROPERTY');
    }
    if (ts.isCallExpression(node) && /^(useState|React\.useState)$/.test(node.expression.getText(sf)) && node.arguments.length) add(name, loc(node), '', 'STATE_INITIALIZER');
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) {
      let value = ts.isTemplateExpression(node) ? node.head.text + node.templateSpans.map(s => ':dynamic' + s.literal.text).join('') : node.text;
      collectSql(value, name, loc(node));
      if (value.startsWith('/api/')) {
        value = value.split('?')[0].split('#')[0];
        const parts = value.split('/');
        const matches = routes.filter(r => {
          const rp = r.endpoint.split('/');
          return rp.length === parts.length && rp.every((p, i) => p === parts[i] || p.startsWith('[') || parts[i].includes(':dynamic'));
        });
        apiReferences.push({ file: name, line: loc(node), endpoint: value, routeStatus: matches.length ? (value.includes(':dynamic') ? 'DYNAMIC_CANDIDATE' : 'MATCH') : 'NO_LOCAL_MATCH', routeFiles: matches.map(m => m.file).join('|') });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
}
const tables = [...new Set(tableReferences.map(r => r.table))].sort().map(table => {
  const rows = tableReferences.filter(r => r.table === table);
  return { table, runtimeFiles: [...new Set(rows.filter(r => r.tier === 'runtime').map(r => r.file))].join('|'), ddlFiles: [...new Set(rows.filter(r => r.operation.startsWith('CREATE TABLE')).map(r => r.file))].join('|'), liveDatabase: 'NOT_VERIFIED', review: 'SQL_CANDIDATE_NOT_SCHEMA_PROOF' };
});
function csv(name, rows, cols) {
  const quote = val => '"' + String(val ?? '').replaceAll('"', '""') + '"';
  fs.writeFileSync(path.join(output, name), '\uFEFF' + [cols, ...rows.map(row => cols.map(col => row[col]))].map(row => row.map(quote).join(',')).join('\n') + '\n');
}
fs.mkdirSync(output, { recursive: true });
csv('static-data-candidates.csv', candidates, ['file', 'line', 'symbol', 'signal', 'tier', 'review']);
csv('api-routes.csv', routes, ['file', 'endpoint', 'methods']);
csv('api-references.csv', apiReferences, ['file', 'line', 'endpoint', 'routeStatus', 'routeFiles']);
csv('table-references.csv', tableReferences, ['file', 'line', 'operation', 'table', 'tier']);
csv('table-coverage.csv', tables, ['table', 'runtimeFiles', 'ddlFiles', 'liveDatabase', 'review']);
const summary = { sourceFiles: files.length, applicationFiles: files.filter(f => /^(app|components|lib|hooks|types)\//.test(relative(f))).length, candidateRows: candidates.length, candidateFiles: new Set(candidates.map(r => r.file)).size, routes: routes.length, apiReferences: apiReferences.length, unmatchedApiReferences: apiReferences.filter(r => r.routeStatus === 'NO_LOCAL_MATCH'), tableCandidates: tables.length, runtimeTablesWithoutLocatedDDL: tables.filter(r => r.runtimeFiles && !r.ddlFiles).map(r => r.table), scope: roots, excludes: [...excluded, 'legacy-static (archived WordPress)', 'certificates', '.env*', 'generated assets'], limitations: 'Static heuristic inventory, not a proof of exhaustive business data classification. Does not inspect database, proxy rewrites, SQL generated dynamically or external services. No literal values copied to CSV; inspect source for context.' };
fs.writeFileSync(path.join(output, 'inventory-summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
