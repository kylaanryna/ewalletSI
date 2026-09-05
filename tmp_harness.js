const vm = require('vm');
const fs = require('fs');
const html = fs.readFileSync('c:/Users/zalfa/OneDrive/Documents/GitHub/ewalletSI/index.html', 'utf8');
const start = html.indexOf('<script>');
const start2 = html.indexOf('>', start) + 1;
const end = html.indexOf('</script>', start2);
const js = html.slice(start2, end);

const storageData = {};
const localStorageStub = {
  getItem(k) { return storageData[k] !== undefined ? storageData[k] : null; },
  setItem(k, v) { storageData[k] = String(v); },
  removeItem(k) { delete storageData[k]; }
};

function makeEl(id) {
  return {
    id: id || '', name: '', value: '', innerHTML: '', textContent: '',
    style: {}, dataset: {}, className: '',
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    querySelectorAll() { return []; }, querySelector() { return null; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 0, height: 0 }; },
    appendChild() {}, remove() {}, addEventListener() {}, focus() {}, closest() { return null; }
  };
}
const els = {};
const documentStub = {
  getElementById(id) { if (!els[id]) els[id] = makeEl(id); return els[id]; },
  createElement: () => makeEl(''),
  body: makeEl('body'),
  addEventListener() {},
  documentElement: { style: {} }
};
const windowStub = {
  innerWidth: 1280,
  matchMedia: () => ({ matches: false }),
  Swal: { fire() {} },
  performance: { now: () => 0 },
  requestAnimationFrame: (fn) => fn(0),
  localStorage: localStorageStub
};
const ctx = {
  document: documentStub, window: windowStub, console,
  localStorage: localStorageStub,
  fetch: async () => ({ ok: false, json: async () => ({ ok: false }) }),
  setInterval: () => 0, clearInterval: () => {},
  FormData: class { get() { return ''; } },
  Number, String, Math, Object, Array, Date, JSON, RegExp, Boolean, Promise
};
vm.createContext(ctx);
vm.runInContext(js, ctx, { filename: 'index-inline.js' });
console.log('SCRIPT EVALUATED OK');

const out = vm.runInContext(`
(function () {
  const res = [];
  // cartWidget
  state.cart[1] = 2;
  const cw = cartWidget();
  res.push('cartWidget has cart-fab: ' + (cw.indexOf('cart-fab') !== -1));
  res.push('cartWidget badge shows 2: ' + (cw.indexOf('>2<') !== -1));
  res.push('cartWidget NO rupiah text: ' + (cw.indexOf('Rp') === -1));
  // cartView single card
  const cv = cartView();
  res.push('cartView single catalog-card: ' + (cv.indexOf('catalog-card cart-card') !== -1));
  res.push('cartView has cart-pay: ' + (cv.indexOf('cart-pay') !== -1));
  res.push('cartView no two-col: ' + (cv.indexOf('two-col') === -1));
  // history list clickable
  state.historyDetailId = null;
  const hv = historyView();
  res.push('historyView clickable card: ' + (hv.indexOf('data-action="history-detail"') !== -1));
  res.push('historyView card has data-id: ' + (hv.indexOf('data-id="') !== -1));
  res.push('historyView item count shown: ' + (hv.indexOf('item') !== -1));
  // history detail for payment entry with items
  state.historyDetailId = state.history[0].id;
  const hd = historyView();
  res.push('history detail view: ' + (hd.indexOf('Detail Transaksi') !== -1));
  res.push('history detail back btn: ' + (hd.indexOf('close-history-detail') !== -1));
  // pushHistory persists to localStorage
  state.historyDetailId = null;
  pushHistory({ type: 'topup', name: 'Test Santri', amount: 25000 });
  const saved = JSON.parse(localStorage.getItem('simart_history_v1'));
  res.push('pushHistory saved to localStorage: ' + (saved && saved[0] && saved[0].name === 'Test Santri'));
  res.push('pushHistory has date: ' + (!!saved[0].date));
  return res.join('\\n');
})();
`, ctx);
console.log(out);