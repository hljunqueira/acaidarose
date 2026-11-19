// Diagnostic evidence for the pre-fix implementation, NOT the expected product contract.
// Executes actual function bodies with fake database dependencies; no network or DB writes.
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
const read = file => fs.readFileSync(file, 'utf8');
const section = (file, from, to) => {
  const src = read(file), start = src.indexOf(from), end = src.indexOf(to, start);
  assert.ok(start >= 0 && end > start, 'Function boundaries changed; inspect before updating diagnostic');
  return src.slice(start, end);
};
function evaluate(code, deps = {}) {
  const context = vm.createContext({ console: { error() {}, warn() {} }, AVEIRO_HQ_ID: 'hq', ...deps });
  const clean = code.replace(/^import .*$/gm, '').replace(/export /g, '');
  vm.runInContext(ts.transpileModule(clean, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText, context);
  return context;
}
const cases = [];
async function test(name, fn) { await fn(); cases.push(name); console.log('CONFIRMED: ' + name); }
(async () => {
  await test('zero free quota disables dynamic excess charging', () => {
    const src = read('components/menu/CustomerProductDetail.tsx');
    const body = src.split('const dynamicGroupsPrice = useMemo(() => {')[1]?.split('}, [hasDynamicGroups, container.optionGroups, customSelections])')[0];
    assert.ok(body);
    const group = { id: 'model-bases', name: 'Bases', maxQty: 0, additionalPrice: 2, priceType: 'Gratis', options: [{ id: 'a', price: 0 }, { id: 'c', price: 0 }] };
    const ctx = evaluate('function calculate(){' + body + '}', { hasDynamicGroups: true, container: { optionGroups: [group] }, customSelections: { 'model-bases': { a: 1, c: 3 } } });
    assert.equal(ctx.calculate(), 0);
    group.priceType = 'Individual';
    ctx.customSelections['model-bases'] = { a: 1 };
    assert.equal(ctx.calculate(), 2, 'explicit zero item falls back to group price');
  });
  await test('cart zero cream quota becomes one free cream', () => {
    const code = section('lib/stores/cartStore.ts', 'export function getPremiumToppingPrice', 'export function computeToppingBreakdown');
    const ctx = evaluate(code);
    assert.equal(ctx.computeItemLineTotal({ container: { name: 'Copo 250gr', precoBase: 6.5, weightGrams: 250, isBaseFixed: true, limiteCremes: 0 }, bases: [{ id: 'a', name: 'acai' }, { id: 'c', name: 'Coco' }], toppings: [] }), 6.5);
  });
  await test('cashier at HQ can manage catalog; missing tenant permits price editing', () => {
    const ctx = evaluate(read('lib/utils/permissions.ts'));
    assert.equal(ctx.canManageMasterCatalog({ role: 'CASHIER', tenantId: '11111111-1111-1111-1111-111111111111' }), true);
    assert.equal(ctx.canEditProductPrices({ role: 'CASHIER' }), true);
  });
  await test('missing identity can resolve to administrator', async () => {
    const ctx = evaluate(read('lib/api/authGuard.ts'), { query: async () => ({ rows: [{ id: 'mock-admin', role: 'SUPER_ADMIN' }] }) });
    const user = await ctx.getAuthUser({ headers: { get: () => null }, cookies: { get: () => undefined }, nextUrl: { searchParams: { get: () => null } } });
    assert.equal(user.role, 'SUPER_ADMIN');
  });
  await test('failed price persistence still returns success', async () => {
    const code = section('lib/repositories/productsRepository.ts', 'export async function setStorePriceOverride', 'export const setStoreProductPrice');
    const ctx = evaluate(code, { query: async () => { throw Error('SIMULATED_FAILURE'); }, recordAuditLog: async () => {} });
    assert.equal((await ctx.setStorePriceOverride('store', 'product', 9)).success, true);
  });
  await test('model stored maximum zero reads as one', async () => {
    const code = section('lib/repositories/optionModelsRepository.ts', 'export async function getOptionModelsByTenant', 'export async function createOptionModel');
    const ctx = evaluate(code, { query: async () => ({ rows: [{ id: 'm', max_qty: 0, min_qty: 1 }] }) });
    assert.equal((await ctx.getOptionModelsByTenant('store'))[0].maxQty, 1);
  });
  await test('local menu visibility writes the global record', async () => {
    const code = section('lib/repositories/categoriesRepository.ts', 'export async function updateMenu', 'export async function reorderCategories');
    let sql = '';
    const ctx = evaluate(code, { query: async q => { sql = q; return { rows: [{ id: 'm', active: false }] }; }, recordAuditLog: async () => {} });
    await ctx.updateMenu('m', { active: false, tenantId: 'store' });
    assert.match(sql, /WHERE id = \$1/);
    assert.doesNotMatch(sql, /tenant_id/);
  });
  await test('order trusts submitted total and paid state without catalog lookup', async () => {
    const code = section('lib/repositories/ordersRepository.ts', 'export async function createOrder', 'export async function getOrderById');
    const queries = [];
    const ctx = evaluate(code, { uuidv4: () => 'diagnostic-order', getTenantByIdOrSlug: async () => ({ id: 'store' }), decrementEstimatedStock: async () => {}, query: async (sql, params) => {
      queries.push(sql);
      if (sql.includes('next_seq')) return { rows: [{ next_seq: 1 }] };
      if (sql.includes('INSERT INTO orders')) return { rows: [{ id: 'diagnostic-order', tenant_id: 'store', total: params[10], payment_status: params[17] }] };
      throw Error('Unexpected diagnostic query');
    } });
    const order = await ctx.createOrder({ tenantId: 'store', items: [{ containerId: 'product', unitPrice: 6.5, lineTotal: 0.01 }], paymentStatus: 'PAID', isTableOrder: false });
    assert.equal(order.total, 0.01);
    assert.equal(order.paymentStatus, 'PAID');
    assert.equal(queries.some(q => q.includes('product_containers')), false);
  });
  await test('assembly screen calls a route without a local handler', () => {
    assert.match(read('components/admin/menu/ContainerAssemblyRulesDialog.tsx'), /\/api\/catalog\?tenantId=/);
    assert.equal(fs.existsSync('app/api/catalog/route.ts'), false);
  });
  console.log(JSON.stringify({ diagnosticCases: cases.length, passed: cases.length, database: 'simulated', purpose: 'reproduce existing defects, not certify correct behavior' }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
