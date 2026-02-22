
// ══════════════════════════════════════════════════════
//  SUPABASE (sbClient — avoids conflict with window.supabase CDN namespace)
// ══════════════════════════════════════════════════════
const SB_URL = 'https://inhyqhtrpsjpiyywtfhw.supabase.co';
const TABLE_PK = {
    vendors: 'vendor_code', parts: 'part_no', products: 'part_no',
    bom: 'id', inventory: 'id', forecast: 'id', vendorkpi: 'id',
    polist: 'po_number', import_history: 'id', alerts: 'id',
    hqtrade: 'shipment_no', landedcost: 'id',
};
let sbClient = null;
let SB_READY = false;

window.addEventListener('load', async () => {
    const saved = localStorage.getItem('scm_sb_key');
    if (saved) await sbConnect(saved, true);
    updateSBIndicator();
});

async function sbConnect(key, silent = false) {
    if (!key || !window.supabase) return false;
    try {
        const client = window.supabase.createClient(SB_URL, key, { auth: { persistSession: false } });
        const { error } = await client.from('vendors').select('vendor_code').limit(1);
        if (error) throw error;
        sbClient = client; SB_READY = true;
        localStorage.setItem('scm_sb_key', key);
        updateSBIndicator();
        if (!silent) toast('Supabase 연결 완료 ✓', 'success');
        return true;
    } catch (e) {
        sbClient = null; SB_READY = false; updateSBIndicator();
        if (!silent) toast('연결 실패: ' + e.message, 'error', 5000);
        return false;
    }
}

function sbDisconnect() {
    sbClient = null; SB_READY = false;
    localStorage.removeItem('scm_sb_key');
    updateSBIndicator();
    toast('Supabase 연결 해제 — LocalStorage 모드', 'info');
}

function updateSBIndicator() {
    const el = document.getElementById('db-indicator');
    if (el) el.innerHTML = SB_READY
        ? '<span style="color:var(--green)">● Supabase</span>'
        : '<span style="color:var(--amber)">● Local</span>';
    const si = document.getElementById('settings-db-status');
    if (si) si.innerHTML = SB_READY
        ? '<span style="color:var(--green)">● Connected</span>'
        : '<span style="color:var(--amber)">● Not connected</span>';
}

function sbClean(rec) {
    const out = {};
    for (const [k, v] of Object.entries(rec)) {
        if (v === undefined) continue;
        out[k] = v === '' ? null : v;
    }
    return out;
}

// legacy stubs (safe to call, do nothing)
async function setupSupabase() { }
async function syncToDatabase() { }

// ── STATE ──────────────────────────────────────────────
const S = { page: 'dashboard', theme: 'dark' };

const PAGE_LABELS = {
    dashboard: 'Dashboard', vendors: 'Vendors', parts: 'Parts Master',
    products: 'Products', bom: 'BOM', forecast: 'Forecast', mrp: 'MRP · Shortage',
    poplan: 'PO Planning', polist: 'PO List', inventory: 'Inventory',
    hqtrade: 'HQ Trade', landedcost: 'Landed Cost', kpi: 'Vendor KPI',
    alerts: 'Alert Center', import: 'Import Data', settings: 'Settings'
};

const DEMO_USERS = {
    admin: { name: 'Admin User', role: 'Administrator', av: 'AD' },
    purchasing: { name: 'Kim Purchasing', role: 'Purchasing', av: 'KP' },
    logistics: { name: 'Park Logistics', role: 'Logistics', av: 'PL' },
    sales: { name: 'Lee Sales', role: 'Sales', av: 'LS' },
    viewer: { name: 'Viewer Only', role: 'Viewer', av: 'VO' },
};

// ── AUTH ───────────────────────────────────────────────
function setDemo(r) {
    document.getElementById('li-role').value = r;
    document.getElementById('li-email').value = r + '@company.com';
}

function doLogin() {
    const r = document.getElementById('li-role').value;
    const u = DEMO_USERS[r] || DEMO_USERS.admin;
    document.getElementById('u-nm').textContent = u.name;
    document.getElementById('u-rl').textContent = u.role;
    document.getElementById('u-av').textContent = u.av;
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    localStorage.setItem('scm_sess', JSON.stringify(u));
    setTimeout(() => (window.nav || nav)('dashboard'), 0);
}

function doLogout() {
    localStorage.removeItem('scm_sess');
    document.getElementById('app').style.display = 'none';
    document.getElementById('login-page').style.display = 'flex';
}

// Auto-login
(function () {
    const sess = localStorage.getItem('scm_sess');
    if (sess) {
        try {
            const u = JSON.parse(sess);
            document.getElementById('u-nm').textContent = u.name;
            document.getElementById('u-rl').textContent = u.role;
            document.getElementById('u-av').textContent = u.av;
            document.getElementById('login-page').style.display = 'none';
            document.getElementById('app').style.display = 'block';
            // nav('dashboard') after all JS is parsed
            setTimeout(() => window.nav ? window.nav('dashboard') : nav('dashboard'), 0);
        } catch (e) { }
    }
})();

// ── NAVIGATION ─────────────────────────────────────────
function nav(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const pg = document.getElementById('pg-' + id);
    if (pg) { pg.classList.add('active'); S.page = id; }
    document.getElementById('bc-cur').textContent = PAGE_LABELS[id] || id;
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('onclick')?.includes(`'${id}'`)) item.classList.add('active');
    });
    document.querySelectorAll('.modal-ov').forEach(m => m.classList.remove('open'));
}

// ── THEME ──────────────────────────────────────────────
function toggleTheme() {
    S.theme = S.theme === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('light', S.theme === 'light');
    document.getElementById('tsw').classList.toggle('on', S.theme === 'light');
    document.getElementById('tlbl').textContent = S.theme === 'light' ? 'Dark mode' : 'Light mode';
    localStorage.setItem('scm_theme', S.theme);
}
const savedTheme = localStorage.getItem('scm_theme');
if (savedTheme === 'light') {
    document.body.classList.add('light');
    S.theme = 'light';
    document.getElementById('tsw').classList.add('on');
    document.getElementById('tlbl').textContent = 'Dark mode';
}

// ── MODALS ─────────────────────────────────────────────
function openM(id) { document.getElementById(id)?.classList.add('open'); }
function closeM(id) { document.getElementById(id)?.classList.remove('open'); }
document.querySelectorAll('.modal-ov').forEach(ov => {
    ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-ov.open').forEach(m => m.classList.remove('open'));
});

// ── DB LAYER — Supabase-first, LocalStorage fallback ──
const DB = {
    async get(table) {
        if (SB_READY && sbClient) {
            try {
                const { data, error } = await sbClient.from(table).select('*').limit(5000);
                if (error) throw error;
                if (data) localStorage.setItem(`scm_${table}`, JSON.stringify(data));
                return data || [];
            } catch (e) { console.warn(`[DB.get:${table}]`, e.message); }
        }
        const r = localStorage.getItem(`scm_${table}`);
        return r ? JSON.parse(r) : [];
    },
    async save(table, data) {
        localStorage.setItem(`scm_${table}`, JSON.stringify(data));
        if (SB_READY && sbClient && data.length > 0) {
            const pk = TABLE_PK[table] || 'id';
            for (let i = 0; i < data.length; i += 400) {
                const { error } = await sbClient.from(table)
                    .upsert(data.slice(i, i + 400).map(sbClean), { onConflict: pk });
                if (error) { console.warn(`[DB.save:${table}]`, error.message); break; }
            }
        }
        return data;
    },
    async upsert(table, rec, key = 'id') {
        const pk = TABLE_PK[table] || key;
        if (!rec.id) rec.id = rec[pk] || Date.now().toString();
        rec.updated_at = new Date().toISOString();
        if (!rec.created_at) rec.created_at = rec.updated_at;
        const local = JSON.parse(localStorage.getItem(`scm_${table}`) || '[]');
        const idx = local.findIndex(r => r[pk] === rec[pk]);
        if (idx >= 0) local[idx] = { ...local[idx], ...rec }; else local.push(rec);
        localStorage.setItem(`scm_${table}`, JSON.stringify(local));
        if (SB_READY && sbClient) {
            const { error } = await sbClient.from(table)
                .upsert(sbClean({ ...rec }), { onConflict: pk });
            if (error) console.warn(`[DB.upsert:${table}]`, error.message);
        }
        return rec;
    },
    async delete(table, id, key = 'id') {
        const pk = TABLE_PK[table] || key;
        const local = JSON.parse(localStorage.getItem(`scm_${table}`) || '[]');
        const filtered = local.filter(r => r[pk] !== id && r.id !== id);
        localStorage.setItem(`scm_${table}`, JSON.stringify(filtered));
        if (SB_READY && sbClient) {
            const { error } = await sbClient.from(table).delete().eq(pk, id);
            if (error) console.warn(`[DB.delete:${table}]`, error.message);
        }
        return filtered;
    },
    async bulkUpsert(table, rows, pkField) {
        const pk = pkField || TABLE_PK[table] || 'id';
        const now = new Date().toISOString();
        const stamped = rows.map(r => ({
            ...r, updated_at: now,
            id: r.id || r[pk] || (Date.now().toString(36) + Math.random().toString(36).slice(2)),
            created_at: r.created_at || now,
        }));
        const local = JSON.parse(localStorage.getItem(`scm_${table}`) || '[]');
        const map = {}; local.forEach(r => { if (r[pk]) map[r[pk]] = r; });
        stamped.forEach(r => { if (r[pk]) map[r[pk]] = { ...(map[r[pk]] || {}), ...r }; });
        localStorage.setItem(`scm_${table}`, JSON.stringify(Object.values(map)));
        if (SB_READY && sbClient && stamped.length > 0) {
            try {
                for (let i = 0; i < stamped.length; i += 400) {
                    const { error } = await sbClient.from(table)
                        .upsert(stamped.slice(i, i + 400).map(sbClean), { onConflict: pk });
                    if (error) throw error;
                }
                return { ok: stamped.length, sbSynced: true };
            } catch (e) { return { ok: stamped.length, sbSynced: false, error: e.message }; }
        }
        return { ok: stamped.length, sbSynced: false };
    },
    async migrateAll() {
        if (!SB_READY) return { error: 'Not connected' };
        const results = {};
        for (const [table, pk] of Object.entries(TABLE_PK)) {
            const local = JSON.parse(localStorage.getItem(`scm_${table}`) || '[]');
            results[table] = local.length
                ? await this.bulkUpsert(table, local, pk)
                : { ok: 0, skipped: true };
        }
        return results;
    }
};

// ── UTILS ──────────────────────────────────────────────
const fmt = (n, d = 0) => n == null ? '—' : new Intl.NumberFormat('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
const fmtUSD = n => '$' + fmt(n, 2);

// ══════════════════════════════════════════════════════
//  STEP 3 — MASTER DATA CRUD + IMPORT ENGINE
// ══════════════════════════════════════════════════════

// ── PAGINATION STATE ───────────────────────────────────
const PG = { vendors: { page: 1, size: 20 }, parts: { page: 1, size: 20 }, products: { page: 1, size: 20 }, bom: { page: 1, size: 50 } };
const SORT = { vendors: { col: 'vendor_code', asc: true }, parts: { col: 'part_no', asc: true }, products: { col: 'part_no', asc: true } };
const FILTER = { vendors: { search: '' }, parts: { search: '', vendor: '' }, products: { search: '', customer: '', type: '' } };
let importPending = null; // holds validated data waiting for commit

// ── TOAST ──────────────────────────────────────────────
function toast(msg, type = 'info', dur = 3000) {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => el.remove(), dur);
}

// ── CONFIRM DIALOG ─────────────────────────────────────
let cdResolve = () => { };
function confirm(title, msg, okLabel = 'Confirm', danger = true) {
    return new Promise(resolve => {
        document.getElementById('cd-title').textContent = title;
        document.getElementById('cd-msg').textContent = msg;
        const btn = document.getElementById('cd-ok-btn');
        btn.textContent = okLabel;
        btn.className = danger ? 'btn btn-p' : 'btn btn-s';
        btn.style.background = danger ? 'var(--red)' : '';
        document.getElementById('confirm-dialog').classList.add('open');
        cdResolve = (v) => {
            document.getElementById('confirm-dialog').classList.remove('open');
            resolve(v);
        };
    });
}

// ── DETAIL PANEL ───────────────────────────────────────
let activeDP = null;
function openDP(id, mode, data = null) {
    closeDP();
    activeDP = id;
    document.getElementById('dp-overlay').classList.add('open');
    const panel = document.getElementById(id);
    if (panel) panel.classList.add('open');

    if (id === 'dp-vendor') prepVendorPanel(mode, data);
    if (id === 'dp-part') prepPartPanel(mode, data);
    if (id === 'dp-product') prepProductPanel(mode, data);
    if (id === 'dp-bom') prepBomPanel(mode, data);
    if (id === 'dp-po') prepPOPanel(mode, data);
    if (id === 'dp-inventory') prepInventoryPanel(mode, data);
}

function closeDP() {
    if (activeDP) document.getElementById(activeDP)?.classList.remove('open');
    document.getElementById('dp-overlay').classList.remove('open');
    activeDP = null;
}

// ── VENDOR PANEL ───────────────────────────────────────
function prepVendorPanel(mode, data) {
    const isNew = mode === 'new';
    document.getElementById('dp-vendor-title').textContent = isNew ? 'Add Vendor' : 'Edit Vendor';
    document.getElementById('dp-vendor-sub').textContent = isNew ? 'Fill required fields' : `Code: ${data?.vendor_code}`;
    document.getElementById('dv-delete-btn').style.display = isNew ? 'none' : 'flex';
    const fields = ['id', 'code', 'name', 'country', 'currency', 'terms', 'incoterms', 'addr1', 'addr2', 'city', 'state', 'postal', 'country-full', 'contact', 'email', 'phone', 'fax', 'bank', 'account', 'swift', 'iban', 'remarks'];
    const keys = ['id', 'vendor_code', 'vendor_name', 'country', 'default_currency', 'payment_terms', 'incoterms', 'address_line1', 'address_line2', 'city', 'state_province', 'postal_code', 'country_full', 'contact_name', 'email', 'phone', 'fax', 'bank_name', 'bank_account', 'swift_code', 'iban', 'remarks'];
    fields.forEach((f, i) => {
        const el = document.getElementById('dv-' + f);
        if (el) el.value = (data && data[keys[i]] !== undefined) ? data[keys[i]] : '';
    });
    // Load trade_type (select field, separate handling)
    const ttEl = document.getElementById('dv-trade-type');
    if (ttEl) ttEl.value = data?.trade_type || 'international';
}

async function saveVendor() {
    const rec = {
        id: document.getElementById('dv-id').value || Date.now().toString(),
        vendor_code: document.getElementById('dv-code').value.trim().toUpperCase(),
        vendor_name: document.getElementById('dv-name').value.trim(),
        country: document.getElementById('dv-country').value.trim().toUpperCase(),
        default_currency: document.getElementById('dv-currency').value,
        payment_terms: document.getElementById('dv-terms').value.trim(),
        incoterms: document.getElementById('dv-incoterms').value.trim(),
        trade_type: document.getElementById('dv-trade-type').value,
        address_line1: document.getElementById('dv-addr1').value.trim(),
        address_line2: document.getElementById('dv-addr2').value.trim(),
        city: document.getElementById('dv-city').value.trim(),
        state_province: document.getElementById('dv-state').value.trim(),
        postal_code: document.getElementById('dv-postal').value.trim(),
        country_full: document.getElementById('dv-country-full').value.trim(),
        contact_name: document.getElementById('dv-contact').value.trim(),
        email: document.getElementById('dv-email').value.trim(),
        phone: document.getElementById('dv-phone').value.trim(),
        fax: document.getElementById('dv-fax').value.trim(),
        bank_name: document.getElementById('dv-bank').value.trim(),
        bank_account: document.getElementById('dv-account').value.trim(),
        swift_code: document.getElementById('dv-swift').value.trim(),
        iban: document.getElementById('dv-iban').value.trim(),
        remarks: document.getElementById('dv-remarks').value.trim(),
    };
    if (!rec.vendor_code || !rec.vendor_name || !rec.country) { toast('Required fields missing (Code, Name, Country)', 'error'); return; }
    await DB.upsert('vendors', rec, 'id');
    toast(`Vendor ${rec.vendor_code} saved`, 'success');
    closeDP();
    renderVendors();
}

// ── PART PANEL ─────────────────────────────────────────
async function prepPartPanel(mode, data) {
    const isNew = mode === 'new';
    document.getElementById('dp-part-title').textContent = isNew ? 'Add Part' : 'Edit Part';
    document.getElementById('dp-part-sub').textContent = isNew ? 'Sub-material master' : `Part: ${data?.part_no}`;
    document.getElementById('dp-delete-btn').style.display = isNew ? 'none' : 'flex';

    // Populate vendor select
    const vendors = await DB.get('vendors');
    const vsel = document.getElementById('dp-part-vendor');
    vsel.innerHTML = '<option value="">— Select vendor —</option>' +
        vendors.map(v => `<option value="${v.vendor_code}">${v.vendor_code} — ${v.vendor_name}</option>`).join('');

    const fields = ['id', 'partno', 'partname', 'category', 'inout', 'material', 'price', 'currency', 'pricedate', 'hscode', 'moq', 'packsize', 'ltmp', 'ltdev', 'incoterms', 'shipping', 'safetystock', 'unit', 'remarks'];
    const keys = ['id', 'part_no', 'part_name', 'category', 'in_out', 'material', 'price', 'currency', 'price_date', 'hs_code', 'moq', 'std_pack_size', 'leadtime_mp', 'leadtime_dev', 'incoterms', 'shipping_method', 'safety_stock', 'unit', 'remarks'];
    fields.forEach((f, i) => {
        const el = document.getElementById('dp-' + f);
        if (el) el.value = (data && data[keys[i]] !== undefined) ? data[keys[i]] : '';
    });
    if (data?.vendor_code) document.getElementById('dp-part-vendor').value = data.vendor_code;
}

async function savePart() {
    const rec = {
        id: document.getElementById('dp-id').value || Date.now().toString(),
        part_no: document.getElementById('dp-partno').value.trim(),
        part_name: document.getElementById('dp-partname').value.trim(),
        category: document.getElementById('dp-category').value,
        in_out: document.getElementById('dp-inout').value,
        vendor_code: document.getElementById('dp-part-vendor').value,
        material: document.getElementById('dp-material').value.trim(),
        price: parseFloat(document.getElementById('dp-price').value) || 0,
        currency: document.getElementById('dp-currency').value,
        price_date: document.getElementById('dp-pricedate').value,
        hs_code: document.getElementById('dp-hscode').value.trim(),
        moq: parseInt(document.getElementById('dp-moq').value) || 0,
        std_pack_size: parseInt(document.getElementById('dp-packsize').value) || 0,
        leadtime_mp: parseInt(document.getElementById('dp-ltmp').value) || 0,
        leadtime_dev: parseInt(document.getElementById('dp-ltdev').value) || 0,
        incoterms: document.getElementById('dp-incoterms').value.trim(),
        shipping_method: document.getElementById('dp-shipping').value,
        safety_stock: document.getElementById('dp-safetystock').value.trim(),
        unit: document.getElementById('dp-unit').value,
        remarks: document.getElementById('dp-remarks').value.trim(),
    };
    if (!rec.part_no || !rec.part_name || !rec.vendor_code) { toast('Required: Part No, Part Name, Vendor', 'error'); return; }
    await DB.upsert('parts', rec, 'id');
    toast(`Part ${rec.part_no} saved`, 'success');
    closeDP();
    renderParts();
}

// ── PRODUCT PANEL ──────────────────────────────────────
function prepProductPanel(mode, data) {
    const isNew = mode === 'new';
    document.getElementById('dp-product-title').textContent = isNew ? 'Add Product' : 'Edit Product';
    document.getElementById('dpr-delete-btn').style.display = isNew ? 'none' : 'flex';
    const fields = ['id', 'partno', 'kbpartno', 'carcode', 'subcode', 'partname', 'price', 'currency', 'incoterms', 'remarks'];
    const keys = ['id', 'part_no', 'kb_part_no', 'car_code', 'sub_code', 'part_name', 'price', 'currency', 'incoterms', 'remarks'];
    fields.forEach((f, i) => {
        const el = document.getElementById('dpr-' + f);
        if (el) el.value = (data && data[keys[i]] !== undefined) ? data[keys[i]] : '';
    });
    if (data?.customer) document.getElementById('dpr-customer').value = data.customer;
    if (data?.type) document.getElementById('dpr-type').value = data.type || 'mp';
}

async function saveProduct() {
    const rec = {
        id: document.getElementById('dpr-id').value || Date.now().toString(),
        part_no: document.getElementById('dpr-partno').value.trim(),
        kb_part_no: document.getElementById('dpr-kbpartno').value.trim(),
        car_code: document.getElementById('dpr-carcode').value.trim(),
        sub_code: document.getElementById('dpr-subcode').value.trim(),
        part_name: document.getElementById('dpr-partname').value.trim(),
        customer: document.getElementById('dpr-customer').value,
        type: document.getElementById('dpr-type').value,
        price: parseFloat(document.getElementById('dpr-price').value) || 0,
        currency: document.getElementById('dpr-currency').value,
        incoterms: document.getElementById('dpr-incoterms').value,
        remarks: document.getElementById('dpr-remarks').value.trim(),
    };
    if (!rec.part_no || !rec.part_name || !rec.customer) { toast('Required: Part No, Part Name, Customer', 'error'); return; }
    await DB.upsert('products', rec, 'id');
    toast(`Product ${rec.part_no} saved`, 'success');
    closeDP();
    renderProducts();
}

// ── BOM PANEL ──────────────────────────────────────────
async function prepBomPanel(mode, data) {
    const isNew = mode === 'new';
    document.getElementById('dp-bom-title').textContent = isNew ? 'Add BOM Row' : 'Edit BOM Row';
    document.getElementById('db-delete-btn').style.display = isNew ? 'none' : 'flex';

    const products = await DB.get('products');
    const parts = await DB.get('parts');

    document.getElementById('db-assy').innerHTML = '<option value="">— Select Assy —</option>' +
        products.map(p => `<option value="${p.part_no}">${p.part_no} — ${p.part_name || ''}</option>`).join('');
    document.getElementById('db-part').innerHTML = '<option value="">— Select Part —</option>' +
        parts.map(p => `<option value="${p.part_no}">${p.part_no} — ${p.part_name || ''}</option>`).join('');

    if (data) {
        document.getElementById('db-id').value = data.id || '';
        document.getElementById('db-assy').value = data.assy_part_no || '';
        document.getElementById('db-part').value = data.part_no || '';
        document.getElementById('db-lr').value = data.lr || '-';
        document.getElementById('db-qty').value = data.qty || 1;
        document.getElementById('db-carcode').value = data.car_code || '';
        document.getElementById('db-subcode').value = data.sub_code || '';
        document.getElementById('db-remarks').value = data.remarks || '';
    } else {
        ['db-id', 'db-carcode', 'db-subcode', 'db-remarks'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        document.getElementById('db-assy').value = '';
        document.getElementById('db-part').value = '';
        document.getElementById('db-lr').value = '-';
        document.getElementById('db-qty').value = 1;
    }
}

async function saveBom() {
    const rec = {
        id: document.getElementById('db-id').value || Date.now().toString(),
        assy_part_no: document.getElementById('db-assy').value,
        part_no: document.getElementById('db-part').value,
        lr: document.getElementById('db-lr').value,
        qty: parseInt(document.getElementById('db-qty').value) || 1,
        car_code: document.getElementById('db-carcode').value.trim(),
        sub_code: document.getElementById('db-subcode').value.trim(),
        remarks: document.getElementById('db-remarks').value.trim(),
    };
    if (!rec.assy_part_no || !rec.part_no) { toast('Required: Assembly and Part', 'error'); return; }
    await DB.upsert('bom', rec, 'id');
    toast('BOM row saved', 'success');
    closeDP();
    renderBom();
}

// ── DELETE ─────────────────────────────────────────────
async function deleteRecord(table, id) {
    if (!id) return;
    const ok = await confirm('Delete Record', 'This action cannot be undone. Are you sure?', 'Delete', true);
    if (!ok) return;
    await DB.delete(table, id);
    toast('Record deleted', 'warn');
    closeDP();
    if (table === 'vendors') renderVendors();
    if (table === 'parts') renderParts();
    if (table === 'products') renderProducts();
    if (table === 'bom') renderBom();
}

// ══════════════════════════════════════════════════════
//  TABLE RENDERERS
// ══════════════════════════════════════════════════════
function fmt2(n, d = 0) { return n == null || n === '' ? '—' : new Intl.NumberFormat('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n); }

// ── VENDORS ────────────────────────────────────────────
async function renderVendors() {
    let data = await DB.get('vendors');
    const s = FILTER.vendors.search.toLowerCase();
    if (s) data = data.filter(r => (r.vendor_code + r.vendor_name + r.country + r.city).toLowerCase().includes(s));

    // Sort
    const { col, asc } = SORT.vendors;
    data.sort((a, b) => { const va = String(a[col] || ''), vb = String(b[col] || ''); return asc ? va.localeCompare(vb) : vb.localeCompare(va); });

    // Pagination
    const pg = PG.vendors;
    const total = data.length;
    const pages = Math.max(1, Math.ceil(total / pg.size));
    pg.page = Math.min(pg.page, pages);
    const slice = data.slice((pg.page - 1) * pg.size, pg.page * pg.size);

    document.getElementById('vendors-sub').textContent = `Supplier master — ${total} vendors`;
    document.getElementById('vendors-count').textContent = `${total} vendors`;

    const tbody = document.getElementById('vendors-tbody');
    tbody.innerHTML = slice.map(v => `
    <tr onclick="openDP('dp-vendor','edit',${JSON.stringify(v).replace(/"/g, '&quot;')})">
      <td class="mono tc">${v.vendor_code || '—'}</td>
      <td class="tx fw">${v.vendor_name || '—'}</td>
      <td class="tx">${v.country || '—'}</td>
      <td class="tx mu">${v.city || '—'}</td>
      <td class="tx mu">${v.contact_name || '—'}</td>
      <td class="mono">${v.leadtime_mp || '—'}</td>
      <td class="mono">${v.default_currency || '—'}</td>
      <td class="tx mu">${v.payment_terms || '—'}</td>
      <td class="tx mu">${v.address_line1 ? '✓' : '<span class="nn">Missing</span>'}</td>
      <td><span class="badge ${v.vendor_name && v.country && v.address_line1 ? 'badge-g' : 'badge-a'}">${v.vendor_name && v.country && v.address_line1 ? 'Active' : 'Incomplete'}</span></td>
      <td><button class="btn btn-g btn-sm btn-ic" onclick="event.stopPropagation();openDP('dp-vendor','edit',${JSON.stringify(v).replace(/"/g, '&quot;')})">✏️</button></td>
    </tr>`).join('') || `<tr><td colspan="11"><div class="empty"><div class="empty-icon">🏭</div><div class="empty-text">No vendors yet — <span style="color:var(--cyan);cursor:pointer" onclick="openDP('dp-vendor','new')">Add one</span> or <span style="color:var(--cyan);cursor:pointer" onclick="nav('import')">import from template</span></div></div></td></tr>`;

    renderPagination('vendors', total, pg.size, pg.page);
}

async function renderVendorTable() { await renderVendors(); }

// ── PARTS ──────────────────────────────────────────────
async function renderParts() {
    let data = await DB.get('parts');
    const s = FILTER.parts.search.toLowerCase();
    const vf = FILTER.parts.vendor;
    if (s) data = data.filter(r => (r.part_no + r.part_name + r.category).toLowerCase().includes(s));
    if (vf) data = data.filter(r => r.vendor_code === vf);

    const { col, asc } = SORT.parts;
    data.sort((a, b) => {
        const va = a[col] || '', vb = b[col] || '';
        if (typeof va === 'number') return asc ? va - vb : vb - va;
        return asc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

    const pg = PG.parts;
    const total = data.length;
    const pages = Math.max(1, Math.ceil(total / pg.size));
    pg.page = Math.min(pg.page, pages);
    const slice = data.slice((pg.page - 1) * pg.size, pg.page * pg.size);

    document.getElementById('parts-sub').textContent = `Sub-material master — ${total} parts`;
    document.getElementById('parts-count').textContent = `${total} parts`;

    // Update vendor filter options
    const vendors = await DB.get('vendors');
    const vsel = document.getElementById('parts-filter-vendor');
    const curV = vsel.value;
    vsel.innerHTML = '<option value="">All Vendors</option>' +
        vendors.map(v => `<option value="${v.vendor_code}">${v.vendor_code}</option>`).join('');
    vsel.value = curV;

    const catBadge = cat => {
        const m = {
            'Back Plate': 'badge-c', 'Noise Shim': 'badge-m', 'Cover Shim': 'badge-m',
            'Sensor': 'badge-a', 'Clip': 'badge-g', 'Spring': 'badge-m'
        }; return `<span class="badge ${m[cat] || 'badge-m'}">${cat || '—'}</span>`;
    };

    const tbody = document.getElementById('parts-tbody');
    tbody.innerHTML = slice.map(p => `
    <tr onclick="openDP('dp-part','edit',${JSON.stringify(p).replace(/"/g, '&quot;')})">
      <td class="mono tc">${p.part_no || '—'}</td>
      <td class="tx">${p.part_name || '—'}</td>
      <td>${catBadge(p.category)}</td>
      <td class="tx mu">${p.in_out || '—'}</td>
      <td class="tx">${p.vendor_code || '—'}</td>
      <td class="mono ri">${fmt2(p.price, p.currency === 'KRW' ? 0 : 4)}</td>
      <td class="mono">${p.currency || '—'}</td>
      <td class="mono ri">${fmt2(p.moq)}</td>
      <td class="mono ri">${fmt2(p.std_pack_size)}</td>
      <td class="mono">${p.leadtime_mp ? p.leadtime_mp + ' days' : '—'}</td>
      <td class="mono">${p.safety_stock || '—'}</td>
      <td><button class="btn btn-g btn-sm btn-ic" onclick="event.stopPropagation();openDP('dp-part','edit',${JSON.stringify(p).replace(/"/g, '&quot;')})">✏️</button></td>
    </tr>`).join('') || `<tr><td colspan="12"><div class="empty"><div class="empty-icon">🔩</div><div class="empty-text">No parts yet — <span style="color:var(--cyan);cursor:pointer" onclick="openDP('dp-part','new')">Add one</span> or <span style="color:var(--cyan);cursor:pointer" onclick="nav('import')">import</span></div></div></td></tr>`;

    renderPagination('parts', total, pg.size, pg.page);
}

// ── PRODUCTS ───────────────────────────────────────────
async function renderProducts() {
    let data = await DB.get('products');
    const s = FILTER.products.search.toLowerCase();
    const cf = FILTER.products.customer;
    const tf = FILTER.products.type;
    if (s) data = data.filter(r => (r.part_no + r.part_name + r.car_code + r.kb_part_no).toLowerCase().includes(s));
    if (cf) data = data.filter(r => r.customer === cf);
    if (tf) data = data.filter(r => r.type === tf);

    const { col, asc } = SORT.products;
    data.sort((a, b) => { const va = String(a[col] || ''), vb = String(b[col] || ''); return asc ? va.localeCompare(vb) : vb.localeCompare(va); });

    const pg = PG.products;
    const total = data.length;
    const pages = Math.max(1, Math.ceil(total / pg.size));
    pg.page = Math.min(pg.page, pages);
    const slice = data.slice((pg.page - 1) * pg.size, pg.page * pg.size);

    document.getElementById('products-sub').textContent = `Finished product master — ${total} products`;
    document.getElementById('products-count').textContent = `${total} products`;

    // Customer filter
    const custs = [...new Set(data.map(r => r.customer).filter(Boolean))].sort();
    const csel = document.getElementById('products-filter-customer');
    const curC = csel.value;
    csel.innerHTML = '<option value="">All Customers</option>' + custs.map(c => `<option>${c}</option>`).join('');
    csel.value = curC;

    const tbody = document.getElementById('products-tbody');
    tbody.innerHTML = slice.map(p => `
    <tr onclick="openDP('dp-product','edit',${JSON.stringify(p).replace(/"/g, '&quot;')})">
      <td class="mono tc">${p.part_no || '—'}</td>
      <td class="mono">${p.car_code || '—'}</td>
      <td class="tx fw">${p.part_name || '—'}</td>
      <td class="tx">${p.customer || '—'}</td>
      <td class="mono mu">${p.kb_part_no || '—'}</td>
      <td class="mono ri">${fmt2(p.price, 3)}</td>
      <td class="mono">${p.currency || '—'}</td>
      <td class="tx mu">${p.incoterms || '—'}</td>
      <td><span class="badge ${p.type === 'mp' ? 'badge-g' : 'badge-c'}">${p.type || '—'}</span></td>
      <td><button class="btn btn-g btn-sm btn-ic" onclick="event.stopPropagation();openDP('dp-product','edit',${JSON.stringify(p).replace(/"/g, '&quot;')})">✏️</button></td>
    </tr>`).join('') || `<tr><td colspan="10"><div class="empty"><div class="empty-icon">📦</div><div class="empty-text">No products yet — <span style="color:var(--cyan);cursor:pointer" onclick="openDP('dp-product','new')">Add one</span> or <span style="color:var(--cyan);cursor:pointer" onclick="nav('import')">import</span></div></div></td></tr>`;

    renderPagination('products', total, pg.size, pg.page);
}

// ── BOM ────────────────────────────────────────────────
async function renderBom() {
    const bom = await DB.get('bom');
    const products = await DB.get('products');
    const parts = await DB.get('parts');

    document.getElementById('bom-sub').textContent = `${bom.length} BOM entries — ${[...new Set(bom.map(r => r.assy_part_no))].length} assemblies`;

    renderBomTree();
    renderBomFlat();
}

async function renderBomTree() {
    const bom = await DB.get('bom');
    const products = await DB.get('products');
    const parts = await DB.get('parts');
    const q = document.getElementById('bom-search')?.value.toLowerCase() || '';

    // Group by assy
    const groups = {};
    bom.forEach(row => {
        if (!groups[row.assy_part_no]) groups[row.assy_part_no] = [];
        groups[row.assy_part_no].push(row);
    });

    const assyList = Object.keys(groups).filter(a => {
        if (!q) return true;
        const p = products.find(pr => pr.part_no === a);
        return a.toLowerCase().includes(q) || (p?.part_name || '').toLowerCase().includes(q) ||
            groups[a].some(r => r.part_no.toLowerCase().includes(q) || (parts.find(pt => pt.part_no === r.part_no)?.part_name || '').toLowerCase().includes(q));
    });

    document.getElementById('bom-count').textContent = `${assyList.length} assemblies`;

    const container = document.getElementById('bom-tree-body');
    if (assyList.length === 0) {
        container.innerHTML = `<div class="empty"><div class="empty-icon">🗂️</div><div class="empty-text">No BOM data — <span style="color:var(--cyan);cursor:pointer" onclick="nav('import')">import from template</span></div></div>`;
        return;
    }

    // Track expanded state
    const expanded = container._expanded || new Set(assyList.slice(0, 3));
    container._expanded = expanded;

    container.innerHTML = assyList.map(assy => {
        const prod = products.find(p => p.part_no === assy);
        const rows = groups[assy];
        const isExp = expanded.has(assy);
        const partsHtml = isExp ? rows.map(row => {
            const part = parts.find(p => p.part_no === row.part_no);
            return `<div class="bom-part" onclick="event.stopPropagation();openDP('dp-bom','edit',${JSON.stringify(row).replace(/"/g, '&quot;')})">
        <div class="bom-tree-line"></div>
        <span class="mono tc" style="min-width:140px">${row.part_no}</span>
        <span class="tx" style="flex:1;min-width:180px">${part?.part_name || row.part_no}</span>
        <span class="badge ${row.lr === 'L' ? 'badge-c' : row.lr === 'R' ? 'badge-a' : 'badge-m'}" style="margin-right:8px">${row.lr || '—'}</span>
        <span class="mono mu" style="min-width:40px;text-align:right">×${row.qty}</span>
        <span class="mono mu" style="min-width:80px;text-align:right">${part?.vendor_code || '—'}</span>
        <button class="btn btn-g btn-sm btn-ic" style="margin-left:8px" onclick="event.stopPropagation();openDP('dp-bom','edit',${JSON.stringify(row).replace(/"/g, '&quot;')})">✏️</button>
      </div>`;
        }).join('') : '';

        return `<div>
      <div class="bom-assy ${isExp ? 'expanded' : ''}" onclick="toggleBomAssy('${assy}', this)">
        <span class="bom-assy-toggle">▶</span>
        <span class="mono tc fw" style="min-width:160px">${assy}</span>
        <span class="tx" style="flex:1">${prod?.part_name || ''}</span>
        <span class="tx mu" style="font-size:11px;margin-right:8px">${prod?.customer || ''}</span>
        <span class="badge badge-m" style="margin-right:8px">${rows.length} parts</span>
        <button class="btn btn-g btn-sm" onclick="event.stopPropagation();openDP('dp-bom','new')" title="Add part to this assy">+</button>
      </div>
      <div id="bom-children-${assy.replace(/[^a-zA-Z0-9]/g, '_')}">${partsHtml}</div>
    </div>`;
    }).join('');
}

function toggleBomAssy(assy, el) {
    const container = document.getElementById('bom-tree-body');
    const expanded = container._expanded || new Set();
    container._expanded = expanded;
    const childEl = document.getElementById('bom-children-' + assy.replace(/[^a-zA-Z0-9]/g, '_'));
    if (expanded.has(assy)) {
        expanded.delete(assy);
        el.classList.remove('expanded');
        if (childEl) childEl.innerHTML = '';
    } else {
        expanded.add(assy);
        el.classList.add('expanded');
        renderBomTree();
    }
}

async function renderBomFlat() {
    const bom = await DB.get('bom');
    const q = document.getElementById('bom-flat-search')?.value.toLowerCase() || '';
    const data = q ? bom.filter(r => (r.assy_part_no + r.part_no).toLowerCase().includes(q)) : bom;

    document.getElementById('bom-flat-count').textContent = `${data.length} rows`;
    document.getElementById('bom-flat-tbody').innerHTML = data.map(row => `
    <tr onclick="openDP('dp-bom','edit',${JSON.stringify(row).replace(/"/g, '&quot;')})">
      <td class="mono tc">${row.assy_part_no}</td>
      <td class="mono tc">${row.part_no}</td>
      <td class="tx mu">${row.part_name || '—'}</td>
      <td><span class="badge ${row.lr === 'L' ? 'badge-c' : row.lr === 'R' ? 'badge-a' : 'badge-m'}">${row.lr || '—'}</span></td>
      <td class="mono">${row.qty || 1}</td>
      <td class="mono mu">${row.car_code || '—'}</td>
      <td class="mono mu">${row.sub_code || '—'}</td>
      <td><button class="btn btn-g btn-sm btn-ic" onclick="event.stopPropagation();openDP('dp-bom','edit',${JSON.stringify(row).replace(/"/g, '&quot;')})">✏️</button></td>
    </tr>`).join('') || '<tr><td colspan="8"><div class="empty"><div class="empty-icon">🗂️</div><div class="empty-text">No BOM data</div></div></td></tr>';
}

function setBomView(view, tab) {
    document.querySelectorAll('#bom-tabs .tab').forEach(t => t.classList.remove('on'));
    tab.classList.add('on');
    document.getElementById('bom-tree-view').style.display = view === 'tree' ? '' : 'none';
    document.getElementById('bom-flat-view').style.display = view === 'flat' ? '' : 'none';
    if (view === 'flat') renderBomFlat();
}

// ── PAGINATION ─────────────────────────────────────────
function renderPagination(table, total, size, current) {
    const pages = Math.max(1, Math.ceil(total / size));
    const infoEl = document.getElementById(table + '-pg-info');
    const btnsEl = document.getElementById(table + '-pg-btns');
    if (!infoEl || !btnsEl) return;

    const from = total === 0 ? 0 : (current - 1) * size + 1;
    const to = Math.min(current * size, total);
    infoEl.textContent = `Showing ${from}–${to} of ${total}`;

    const range = [];
    if (pages <= 7) {
        for (let i = 1; i <= pages; i++) range.push(i);
    } else {
        range.push(1);
        if (current > 3) range.push('...');
        for (let i = Math.max(2, current - 1); i <= Math.min(pages - 1, current + 1); i++) range.push(i);
        if (current < pages - 2) range.push('...');
        range.push(pages);
    }

    btnsEl.innerHTML = range.map(p => typeof p === 'number'
        ? `<div class="pg-btn ${p === current ? 'on' : ''}" onclick="goPage('${table}',${p})">${p}</div>`
        : `<div class="pg-btn" style="cursor:default;border:none">…</div>`
    ).join('');
}

function goPage(table, p) {
    PG[table].page = p;
    if (table === 'vendors') renderVendors();
    if (table === 'parts') renderParts();
    if (table === 'products') renderProducts();
}

// ── SEARCH / FILTER ────────────────────────────────────
function filterTable(table) {
    PG[table].page = 1;
    if (table === 'vendors') {
        FILTER.vendors.search = document.getElementById('vendors-search').value;
        renderVendors();
    } else if (table === 'parts') {
        FILTER.parts.search = document.getElementById('parts-search').value;
        FILTER.parts.vendor = document.getElementById('parts-filter-vendor').value;
        renderParts();
    } else if (table === 'products') {
        FILTER.products.search = document.getElementById('products-search').value;
        FILTER.products.customer = document.getElementById('products-filter-customer').value;
        FILTER.products.type = document.getElementById('products-filter-type').value;
        renderProducts();
    } else if (table === 'bom') {
        renderBomFlat();
    }
}

function sortTable(table, col) {
    if (!SORT[table]) return;
    SORT[table].asc = SORT[table].col === col ? !SORT[table].asc : true;
    SORT[table].col = col;
    PG[table].page = 1;
    if (table === 'vendors') renderVendors();
    if (table === 'parts') renderParts();
    if (table === 'products') renderProducts();
}

// ── IMPORT ENGINE ──────────────────────────────────────
// Requires SheetJS (loaded from CDN)
function initImportPage() {
    const dropZone = document.querySelector('#pg-import .card-body div[style*="dashed"]');
    if (!dropZone) return;

    // Click to browse
    dropZone.onclick = () => {
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = '.xlsx,.xlsm,.xls';
        inp.onchange = e => processImportFile(e.target.files[0]);
        inp.click();
    };

    // Drag & drop
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor = 'var(--cyan)'; });
    dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = 'var(--bd)'; });
    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--bd)';
        const file = e.dataTransfer.files[0];
        if (file) processImportFile(file);
    });
}

async function processImportFile(file) {
    if (!file) return;
    if (!window.XLSX) {
        toast('Loading Excel parser...', 'info');
        await loadXLSX();
    }

    openDP('dp-import-result', 'new');
    document.getElementById('import-result-sub').textContent = `Processing: ${file.name}`;
    document.getElementById('import-steps').innerHTML = '<div style="color:var(--t3);font-size:12px">Reading file...</div>';
    document.getElementById('import-errors').style.display = 'none';
    document.getElementById('import-commit-btn').style.display = 'none';
    document.getElementById('import-dl-errors').style.display = 'none';

    const reader = new FileReader();
    reader.onload = async e => {
        try {
            const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
            await validateAndPreview(wb, file.name);
        } catch (err) {
            toast('Failed to read file: ' + err.message, 'error');
        }
    };
    reader.readAsArrayBuffer(file);
}

function loadXLSX() {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

function sheetToObjects(ws) {
    if (!ws) return [];
    // Row 5 = headers (index 4), data starts row 6
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    const headers = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r: 4, c })];
        if (cell) headers.push(String(cell.v).replace(/\s*\*\s*/g, '').trim().toLowerCase().replace(/\s+/g, '_'));
        else headers.push(`col_${c}`);
    }

    const rows = [];
    for (let r = 5; r <= range.e.r; r++) {
        const obj = {};
        let hasData = false;
        for (let c = range.s.c; c <= range.e.c; c++) {
            const cell = ws[XLSX.utils.encode_cell({ r, c })];
            if (cell && cell.v !== undefined && cell.v !== '') {
                obj[headers[c]] = cell.t === 'd' ? formatDate(cell.v) : cell.v;
                hasData = true;
            } else {
                obj[headers[c]] = '';
            }
        }
        if (hasData) rows.push(obj);
    }
    return rows;
}

function formatDate(d) {
    if (!d) return '';
    if (d instanceof Date) return d.toISOString().slice(0, 10);
    return String(d).slice(0, 10);
}

async function validateAndPreview(wb, filename) {
    const SHEETS = {
        '1_Vendors': { key: 'vendor_code', required: ['vendor_code', 'vendor_name', 'country'], dbTable: 'vendors', idField: 'vendor_code' },
        '2_Parts': { key: 'part_no', required: ['part_no', 'part_name', 'vendor_code'], dbTable: 'parts', idField: 'part_no' },
        '3_Products': { key: 'part_no', required: ['part_no', 'part_name', 'customer'], dbTable: 'products', idField: 'part_no' },
        '4_BOM': { key: null, required: ['assy_part_no', 'part_no', 'lr', 'qty'], dbTable: 'bom', idField: null },
        '5_Inventory': { key: 'part_no', required: ['part_no', 'qty', 'location'], dbTable: 'inventory', idField: 'part_no' },
        '6_Forecast': { key: null, required: ['assy_part_no', 'customer'], dbTable: 'forecast', idField: null },
    };

    const results = {};
    const allErrors = [];
    let vendorCodes = new Set();
    let partNos = new Set();
    let productNos = new Set();

    // Pre-load existing DB data for cross-ref validation
    const existingVendors = new Set((await DB.get('vendors')).map(v => v.vendor_code));
    const existingParts = new Set((await DB.get('parts')).map(p => p.part_no));
    const existingProducts = new Set((await DB.get('products')).map(p => p.part_no));

    for (const [sheetName, cfg] of Object.entries(SHEETS)) {
        const ws = wb.Sheets[sheetName];
        if (!ws) {
            results[sheetName] = { ok: 0, errors: 1, rows: [], msg: `Sheet "${sheetName}" not found` };
            allErrors.push({ sheet: sheetName, row: '—', msg: `Sheet not found` });
            continue;
        }

        const rows = sheetToObjects(ws);
        const validRows = [];
        const sheetErrors = [];

        rows.forEach((row, i) => {
            const rowNum = i + 7; // Excel row number
            const errs = [];

            // Required fields
            cfg.required.forEach(f => {
                if (row[f] === undefined || row[f] === '') errs.push(`"${f}" is required`);
            });

            // Cross-reference validation
            if (sheetName === '2_Parts' && row.vendor_code && !vendorCodes.has(row.vendor_code) && !existingVendors.has(row.vendor_code))
                errs.push(`vendor_code "${row.vendor_code}" not found in 1_Vendors`);
            if (sheetName === '4_BOM') {
                if (row.assy_part_no && !productNos.has(row.assy_part_no) && !existingProducts.has(row.assy_part_no))
                    errs.push(`assy_part_no "${row.assy_part_no}" not in 3_Products`);
                if (row.part_no && !partNos.has(row.part_no) && !existingParts.has(row.part_no))
                    errs.push(`part_no "${row.part_no}" not in 2_Parts`);
                if (row.lr && !['L', 'R', '-', ''].includes(String(row.lr)))
                    errs.push(`lr must be L / R / - (got "${row.lr}")`);
            }
            if (sheetName === '5_Inventory' && row.location && !['onhand', 'intransit', 'vmi', ''].includes(String(row.location).toLowerCase()))
                errs.push(`location must be onhand / intransit / vmi`);

            if (errs.length > 0) {
                errs.forEach(msg => { sheetErrors.push({ row: rowNum, msg }); allErrors.push({ sheet: sheetName, row: rowNum, msg }); });
            } else {
                validRows.push({ ...row, id: row[cfg.idField] || Date.now().toString() + Math.random() });
            }
        });

        // Build cross-ref sets from valid rows
        if (sheetName === '1_Vendors') validRows.forEach(r => vendorCodes.add(r.vendor_code));
        if (sheetName === '2_Parts') validRows.forEach(r => partNos.add(r.part_no));
        if (sheetName === '3_Products') validRows.forEach(r => productNos.add(r.part_no));

        results[sheetName] = { ok: validRows.length, errors: sheetErrors.length, rows: validRows, errs: sheetErrors };
    }

    importPending = results;

    // Render result
    const stepsHtml = Object.entries(results).map(([sheet, res]) => `
    <div class="import-step">
      <div class="is-num ${res.errors > 0 ? 'error' : res.ok > 0 ? 'done' : 'pending'}">${res.errors > 0 ? '!' : res.ok > 0 ? '✓' : '—'}</div>
      <div class="is-label">${sheet}</div>
      <div class="is-count ${res.errors > 0 ? 'err' : res.ok > 0 ? 'ok' : 'pending'}">${res.ok} rows${res.errors > 0 ? ` · ${res.errors} errors` : ''}</div>
    </div>`).join('');

    document.getElementById('import-steps').innerHTML = stepsHtml;
    document.getElementById('import-result-sub').textContent = `${filename} — ${allErrors.length === 0 ? 'All valid ✓' : allErrors.length + ' errors found'}`;

    if (allErrors.length > 0) {
        document.getElementById('import-errors').style.display = '';
        document.getElementById('import-error-list').innerHTML = allErrors.slice(0, 50).map(e =>
            `<div class="err-row"><span class="err-sheet">${e.sheet.split('_')[0]}</span><span class="err-row-num">Row ${e.row}</span><span class="err-msg">${e.msg}</span></div>`
        ).join('') + (allErrors.length > 50 ? `<div class="err-row"><span class="err-msg" style="color:var(--t3)">... and ${allErrors.length - 50} more errors</span></div>` : '');
        document.getElementById('import-dl-errors').style.display = 'flex';
    }

    const totalValid = Object.values(results).reduce((s, r) => s + r.ok, 0);
    if (totalValid > 0) {
        document.getElementById('import-commit-btn').style.display = '';
        document.getElementById('import-commit-btn').textContent = `✅ Save ${totalValid} Valid Rows`;
    }
}

async function commitImport() {
    if (!importPending) return;
    const tableMap = {
        '1_Vendors': 'vendors', '2_Parts': 'parts', '3_Products': 'products',
        '4_BOM': 'bom', '5_Inventory': 'inventory', '6_Forecast': 'forecast'
    };
    const keyMap = {
        '1_Vendors': 'vendor_code', '2_Parts': 'part_no', '3_Products': 'part_no',
        '4_BOM': null, '5_Inventory': 'part_no', '6_Forecast': null
    };

    let saved = 0;
    for (const [sheet, res] of Object.entries(importPending)) {
        if (res.rows.length === 0) continue;
        const table = tableMap[sheet];
        const key = keyMap[sheet];
        if (key) {
            for (const row of res.rows) {
                row.id = row.id || row[key] || Date.now().toString();
                await DB.upsert(table, row, 'id');
                saved++;
            }
        } else {
            const existing = await DB.get(table);
            const merged = [...existing];
            res.rows.forEach(row => { row.id = row.id || Date.now().toString() + Math.random(); merged.push(row); });
            await DB.save(table, merged);
            saved += res.rows.length;
        }
    }

    toast(`Import complete — ${saved} records saved`, 'success');

    // Sync to Supabase via bulkUpsert (sbClient-safe)
    if (SB_READY) {
        toast('Supabase 동기화 중...', 'info', 2000);
    }

    importPending = null;
    closeDP();

    // Add to history
    const hist = await DB.get('import_history');
    hist.push({ id: Date.now().toString(), date: new Date().toISOString().slice(0, 16).replace('T', ' '), status: 'Success', rows: saved });
    await DB.save('import_history', hist);

    renderVendors();
    renderParts();
    renderProducts();
    renderBom();
    renderImportHistory();
}

function downloadErrors() {
    if (!importPending) return;
    const rows = [['Sheet', 'Row', 'Error']];
    Object.entries(importPending).forEach(([sheet, res]) => {
        (res.errs || []).forEach(e => rows.push([sheet, e.row, e.msg]));
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'import_errors.csv'; a.click();
    URL.revokeObjectURL(url);
}

async function renderImportHistory() {
    const hist = await DB.get('import_history');
    const tbody = document.querySelector('#pg-import table tbody');
    if (!tbody) return;
    if (hist.length > 0) {
        tbody.innerHTML = hist.slice().reverse().map(h => `
      <tr>
        <td class="mono">${h.date}</td>
        <td class="tx">SCM_Import_Template.xlsx</td>
        <td class="np ri">${h.rows} ✓</td>
        <td colspan="5" class="mu tx">—</td>
        <td><span class="badge badge-g">${h.status}</span></td>
        <td class="tx mu">Admin</td>
      </tr>`).join('');
    }
}

// ── EXPORT ─────────────────────────────────────────────
async function exportTable(table) {
    const data = await DB.get(table);
    if (data.length === 0) { toast('No data to export', 'warn'); return; }
    if (!window.XLSX) { toast('Loading...', 'info'); await loadXLSX(); }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, table);
    XLSX.writeFile(wb, `${table}_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast(`Exported ${data.length} ${table} records`, 'success');
}

// ── INVENTORY ─────────────────────────────────────────
async function renderInventory() {
    const data = await DB.get('inventory');
    const parts = await DB.get('parts');
    const s = document.getElementById('inventory-search')?.value.toLowerCase() || '';
    const lf = document.getElementById('inventory-filter-location')?.value || '';

    let filtered = data;
    if (s) filtered = filtered.filter(r => r.part_no.toLowerCase().includes(s));
    if (lf) filtered = filtered.filter(r => r.location === lf);

    const counts = { total: filtered.length, onhand: 0, intransit: 0, vmi: 0 };
    filtered.forEach(r => {
        const q = (parseInt(r.qty) || 0);
        if (r.location === 'onhand') counts.onhand += q;
        if (r.location === 'intransit') counts.intransit += q;
        if (r.location === 'vmi') counts.vmi += q;
    });

    document.getElementById('inv-kpi-items').textContent = counts.total;
    document.getElementById('inv-kpi-onhand').textContent = fmt2(counts.onhand);
    document.getElementById('inv-kpi-intransit').textContent = fmt2(counts.intransit);
    document.getElementById('inv-kpi-vmi').textContent = fmt2(counts.vmi);
    document.getElementById('inventory-count').textContent = `${filtered.length} items`;

    const tbody = document.getElementById('inventory-tbody');
    tbody.innerHTML = filtered.map(r => {
        const part = parts.find(p => p.part_no === r.part_no);
        return `<tr>
                    <td class="mono tc">${r.part_no}</td>
                    <td class="tx">${part?.part_name || '—'}</td>
                    <td><span class="badge ${r.location === 'onhand' ? 'badge-g' : r.location === 'intransit' ? 'badge-a' : 'badge-c'}">${r.location}</span></td>
                    <td class="mono ri">${fmt2(r.qty)}</td>
                    <td class="mono mu">${r.lot_no || '—'}</td>
                    <td class="mono mu">${r.date || '—'}</td>
                    <td class="tx mu">${r.remarks || '—'}</td>
                    <td><button class="btn btn-g btn-sm btn-ic" onclick="event.stopPropagation();openDP('dp-inventory','edit',${JSON.stringify(r).replace(/"/g, '&quot;')})">✏️</button></td>
                </tr>`;
    }).join('') || '<tr><td colspan="8"><div class="empty"><div class="empty-icon">🏪</div><div class="empty-text">No inventory records</div></div></td></tr>';
}

// ── PO LIST ───────────────────────────────────────────
async function renderPOList() {
    const data = await DB.get('polist');
    const s = document.getElementById('polist-search')?.value.toLowerCase() || '';
    const sf = document.getElementById('polist-filter-status')?.value || '';

    let filtered = [...data];
    if (s) filtered = filtered.filter(r => (r.po_number + r.vendor_code).toLowerCase().includes(s));
    if (sf) filtered = filtered.filter(r => r.status === sf);
    filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    const totalValue = data.reduce((sum, r) => sum + (parseFloat(r.total_value) || 0), 0);
    const openCount = data.filter(r => ['issued', 'partial'].includes(r.status)).length;
    document.getElementById('polist-count').textContent = `${filtered.length} of ${data.length} orders`;
    const subEl = document.getElementById('polist-sub');
    if (subEl) subEl.textContent = `${data.length} total · ${openCount} open · $${fmt2(totalValue, 0)} total value`;

    const statusBadge = st => ({
        draft: `<span class="badge badge-m">Draft</span>`,
        issued: `<span class="badge badge-c">Issued</span>`,
        partial: `<span class="badge badge-a">Partial</span>`,
        received: `<span class="badge badge-g">Received</span>`,
        cancelled: `<span class="badge badge-r">Cancelled</span>`,
    })[st] || `<span class="badge badge-m">${st}</span>`;

    const tbody = document.getElementById('polist-tbody');
    tbody.innerHTML = filtered.map(r => {
        const prog = parseInt(r.progress) || (r.status === 'received' ? 100 : r.status === 'issued' ? 10 : 0);
        const pc = prog >= 100 ? 'g' : prog > 0 ? 'a' : '';
        const esc = JSON.stringify(r).replace(/"/g, '&quot;');
        return `<tr onclick="openDP('dp-po','edit',${esc})" style="cursor:pointer">
                    <td class="mono tc" style="color:var(--cyan)">${r.po_number || '—'}</td>
                    <td class="mono">${r.date || '—'}</td>
                    <td class="tx fw">${r.vendor_code || '—'}</td>
                    <td class="mono ri">${r.total_value ? '$' + fmt2(r.total_value, 0) : '—'}</td>
                    <td class="mono ri">${r.item_count || 0}</td>
                    <td style="min-width:80px">
                        <div style="display:flex;align-items:center;gap:6px">
                            <div class="prog" style="flex:1"><div class="prog-fill ${pc}" style="width:${prog}%"></div></div>
                            <span class="mono mu" style="font-size:10px;min-width:28px">${prog}%</span>
                        </div>
                    </td>
                    <td>${statusBadge(r.status)}</td>
                    <td class="tx mu">${r.created_by || 'Admin'}</td>
                    <td><button class="btn btn-g btn-sm btn-ic" onclick="event.stopPropagation();openDP('dp-po','edit',${esc})">✏️</button></td>
                </tr>`;
    }).join('') || `<tr><td colspan="9"><div class="empty"><div class="empty-icon">📋</div>
                <div class="empty-text">No POs — <span style="color:var(--cyan);cursor:pointer" onclick="openDP('dp-po','new')">Create</span> or <span style="color:var(--cyan);cursor:pointer" onclick="nav('poplan')">PO Planning</span></div>
                </div></td></tr>`;
}

// ── PAGE INIT ──────────────────────────────────────────
const PAGE_INIT = {
    vendors: renderVendors,
    parts: renderParts,
    products: renderProducts,
    bom: renderBom,
    inventory: renderInventory,
    polist: renderPOList,
    forecast: renderForecast,
    mrp: () => { if (MRP_RESULTS.length > 0) renderMRP(); },
    import: () => { initImportPage(); renderImportHistory(); },
    poplan: renderPOPlan,
    salesorder: renderSalesOrders,
    apar: renderAPAR,
};


// Hook into nav() to trigger page init + mobile sync
const _navOrig = nav;
window.nav = function (id) {
    _navOrig(id);
    if (PAGE_INIT[id]) PAGE_INIT[id]();
    // mobile: close sidebar + sync bottom nav
    if (window.innerWidth <= 768) closeSidebar();
    document.querySelectorAll('.mbn-item').forEach(el =>
        el.classList.toggle('active', el.dataset.page === id));
};

// ── SAMPLE DATA SEED ───────────────────────────────────
async function seedSampleData(force = false) {
    const existing = await DB.get('vendors');
    if (existing.length > 0 && !force) return; // 이미 데이터 있으면 skip

    const today = new Date();
    const fmt = d => d.toISOString().slice(0, 10);
    const daysFrom = n => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); };

    // Vendors
    const vendors = [
        { id: 'v1', vendor_code: 'KOR-001', vendor_name: 'Korean Auto Parts Co.', country: 'KR', default_currency: 'KRW', payment_terms: 'NET30', incoterms: 'FOB', contact_name: 'Kim Minjun', email: 'kim@korauto.kr', phone: '+82-2-1234-5678', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'v2', vendor_code: 'CHN-001', vendor_name: 'Shenzhen Components Ltd.', country: 'CN', default_currency: 'USD', payment_terms: 'NET45', incoterms: 'CIF', contact_name: 'Wang Lei', email: 'wang@shzcomp.cn', phone: '+86-755-8888-9999', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'v3', vendor_code: 'JPN-001', vendor_name: 'Osaka Precision Mfg.', country: 'JP', default_currency: 'JPY', payment_terms: 'NET30', incoterms: 'EXW', contact_name: 'Tanaka Hiroshi', email: 'tanaka@osakamfg.jp', phone: '+81-6-4321-8765', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'v4', vendor_code: 'DEU-001', vendor_name: 'Bayern Automotive GmbH', country: 'DE', default_currency: 'EUR', payment_terms: 'NET60', incoterms: 'DAP', contact_name: 'Hans Mueller', email: 'mueller@bayernauto.de', phone: '+49-89-555-1234', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'v5', vendor_code: 'USA-001', vendor_name: 'Detroit Supply Corp.', country: 'US', default_currency: 'USD', payment_terms: 'NET30', incoterms: 'FCA', contact_name: 'John Smith', email: 'jsmith@detroitsupply.com', phone: '+1-313-555-0100', created_at: fmt(today), updated_at: fmt(today) },
    ];

    // Parts
    const parts = [
        { id: 'p1', part_no: 'P-10001', part_name: 'Front Bumper Bracket', vendor_code: 'KOR-001', leadtime_mp: 14, leadtime_dev: 30, moq: 100, unit_price: 12.50, currency: 'KRW', safety_stock: 200, created_at: fmt(today), updated_at: fmt(today) },
        { id: 'p2', part_no: 'P-10002', part_name: 'Engine Mount Rubber', vendor_code: 'CHN-001', leadtime_mp: 21, leadtime_dev: 45, moq: 500, unit_price: 3.80, currency: 'USD', safety_stock: 1000, created_at: fmt(today), updated_at: fmt(today) },
        { id: 'p3', part_no: 'P-10003', part_name: 'Steering Column Shaft', vendor_code: 'JPN-001', leadtime_mp: 35, leadtime_dev: 60, moq: 50, unit_price: 87.00, currency: 'JPY', safety_stock: 100, created_at: fmt(today), updated_at: fmt(today) },
        { id: 'p4', part_no: 'P-10004', part_name: 'Door Hinge Assembly', vendor_code: 'DEU-001', leadtime_mp: 28, leadtime_dev: 56, moq: 200, unit_price: 24.00, currency: 'EUR', safety_stock: 400, created_at: fmt(today), updated_at: fmt(today) },
        { id: 'p5', part_no: 'P-10005', part_name: 'Brake Disc Rotor', vendor_code: 'KOR-001', leadtime_mp: 14, leadtime_dev: 30, moq: 100, unit_price: 45.00, currency: 'KRW', safety_stock: 300, created_at: fmt(today), updated_at: fmt(today) },
        { id: 'p6', part_no: 'P-10006', part_name: 'Headlight Housing', vendor_code: 'CHN-001', leadtime_mp: 21, leadtime_dev: 45, moq: 50, unit_price: 32.00, currency: 'USD', safety_stock: 150, created_at: fmt(today), updated_at: fmt(today) },
        { id: 'p7', part_no: 'P-10007', part_name: 'Wiring Harness Main', vendor_code: 'USA-001', leadtime_mp: 18, leadtime_dev: 40, moq: 30, unit_price: 156.00, currency: 'USD', safety_stock: 60, created_at: fmt(today), updated_at: fmt(today) },
        { id: 'p8', part_no: 'P-10008', part_name: 'Rear Axle Bearing', vendor_code: 'JPN-001', leadtime_mp: 35, leadtime_dev: 60, moq: 100, unit_price: 62.00, currency: 'JPY', safety_stock: 200, created_at: fmt(today), updated_at: fmt(today) },
    ];

    // Products
    const products = [
        { id: 'pr1', part_no: 'A-20001', car_code: 'KBM-E300', part_name: 'E-Class Front Module Assy', customer: 'Mercedes-Benz', kb_part_no: 'KB-A20001', price: 1250.00, currency: 'USD', incoterms: 'DAP', type: 'mp', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'pr2', part_no: 'A-20002', car_code: 'KBH-K5', part_name: 'K5 Door Module Assy', customer: 'Kia Motors', kb_part_no: 'KB-A20002', price: 480.00, currency: 'KRW', incoterms: 'FOB', type: 'mp', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'pr3', part_no: 'A-20003', car_code: 'KBH-G80', part_name: 'G80 Steering Assy', customer: 'Genesis', kb_part_no: 'KB-A20003', price: 2100.00, currency: 'USD', incoterms: 'CIF', type: 'mp', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'pr4', part_no: 'A-20004', car_code: 'KBM-C200', part_name: 'C-Class Brake Module', customer: 'Mercedes-Benz', kb_part_no: 'KB-A20004', price: 890.00, currency: 'EUR', incoterms: 'DAP', type: 'dev', created_at: fmt(today), updated_at: fmt(today) },
    ];

    // BOM
    const bom = [
        { id: 'b1', assy_part_no: 'A-20001', assy_name: 'E-Class Front Module Assy', sub_part_no: 'P-10001', sub_part_name: 'Front Bumper Bracket', qty: 2, unit: 'ea', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'b2', assy_part_no: 'A-20001', assy_name: 'E-Class Front Module Assy', sub_part_no: 'P-10006', sub_part_name: 'Headlight Housing', qty: 1, unit: 'ea', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'b3', assy_part_no: 'A-20002', assy_name: 'K5 Door Module Assy', sub_part_no: 'P-10004', sub_part_name: 'Door Hinge Assembly', qty: 4, unit: 'ea', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'b4', assy_part_no: 'A-20002', assy_name: 'K5 Door Module Assy', sub_part_no: 'P-10002', sub_part_name: 'Engine Mount Rubber', qty: 2, unit: 'ea', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'b5', assy_part_no: 'A-20003', assy_name: 'G80 Steering Assy', sub_part_no: 'P-10003', sub_part_name: 'Steering Column Shaft', qty: 1, unit: 'ea', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'b6', assy_part_no: 'A-20003', assy_name: 'G80 Steering Assy', sub_part_no: 'P-10007', sub_part_name: 'Wiring Harness Main', qty: 1, unit: 'ea', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'b7', assy_part_no: 'A-20004', assy_name: 'C-Class Brake Module', sub_part_no: 'P-10005', sub_part_name: 'Brake Disc Rotor', qty: 2, unit: 'ea', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'b8', assy_part_no: 'A-20004', assy_name: 'C-Class Brake Module', sub_part_no: 'P-10008', sub_part_name: 'Rear Axle Bearing', qty: 4, unit: 'ea', created_at: fmt(today), updated_at: fmt(today) },
    ];

    // Inventory
    const inventory = [
        { id: 'i1', part_no: 'P-10001', part_name: 'Front Bumper Bracket', location: 'WH-A', qty: 180, onhand: 180, intransit: 50, vmi: 0, unit: 'ea', last_updated: fmt(today), created_at: fmt(today), updated_at: fmt(today) },
        { id: 'i2', part_no: 'P-10002', part_name: 'Engine Mount Rubber', location: 'WH-A', qty: 1200, onhand: 1200, intransit: 0, vmi: 0, unit: 'ea', last_updated: fmt(today), created_at: fmt(today), updated_at: fmt(today) },
        { id: 'i3', part_no: 'P-10003', part_name: 'Steering Column Shaft', location: 'WH-B', qty: 45, onhand: 45, intransit: 100, vmi: 0, unit: 'ea', last_updated: fmt(today), created_at: fmt(today), updated_at: fmt(today) },
        { id: 'i4', part_no: 'P-10004', part_name: 'Door Hinge Assembly', location: 'WH-A', qty: 380, onhand: 380, intransit: 200, vmi: 0, unit: 'ea', last_updated: fmt(today), created_at: fmt(today), updated_at: fmt(today) },
        { id: 'i5', part_no: 'P-10005', part_name: 'Brake Disc Rotor', location: 'WH-B', qty: 80, onhand: 80, intransit: 0, vmi: 0, unit: 'ea', last_updated: fmt(today), created_at: fmt(today), updated_at: fmt(today) },
        { id: 'i6', part_no: 'P-10006', part_name: 'Headlight Housing', location: 'WH-A', qty: 200, onhand: 200, intransit: 0, vmi: 0, unit: 'ea', last_updated: fmt(today), created_at: fmt(today), updated_at: fmt(today) },
        { id: 'i7', part_no: 'P-10007', part_name: 'Wiring Harness Main', location: 'WH-C', qty: 20, onhand: 20, intransit: 30, vmi: 0, unit: 'ea', last_updated: fmt(today), created_at: fmt(today), updated_at: fmt(today) },
        { id: 'i8', part_no: 'P-10008', part_name: 'Rear Axle Bearing', location: 'WH-B', qty: 150, onhand: 150, intransit: 0, vmi: 0, unit: 'ea', last_updated: fmt(today), created_at: fmt(today), updated_at: fmt(today) },
    ];

    // Forecast
    const forecast = [];
    const customers = ['Mercedes-Benz', 'Kia Motors', 'Genesis'];
    const prodList = ['A-20001', 'A-20002', 'A-20003', 'A-20004'];
    let fid = 1;
    for (let w = 0; w < 8; w++) {
        const wDate = new Date(today); wDate.setDate(wDate.getDate() + w * 7);
        const [yr, wk] = getISOWeek ? getISOWeek(wDate) : [wDate.getFullYear(), Math.ceil(wDate.getDate() / 7)];
        const wKey = `${yr}W${String(wk).padStart(2, '0')}`;
        prodList.forEach((pno, pi) => {
            const base = [120, 80, 60, 40][pi];
            const qty = base + Math.floor(Math.random() * 30);
            forecast.push({ id: `f${fid++}`, week: wKey, part_no: pno, customer: customers[pi % 3], qty, created_at: fmt(today), updated_at: fmt(today) });
        });
    }

    // PO List
    const polist = [
        { id: 'po1', po_number: 'PO-2026-001', vendor_code: 'KOR-001', vendor_name: 'Korean Auto Parts Co.', part_no: 'P-10001', part_name: 'Front Bumper Bracket', qty: 500, unit_price: 12.50, currency: 'KRW', total_value: 6250, eta: daysFrom(7), status: 'issued', incoterms: 'FOB', created_by: 'Admin', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'po2', po_number: 'PO-2026-002', vendor_code: 'CHN-001', vendor_name: 'Shenzhen Components Ltd.', part_no: 'P-10002', part_name: 'Engine Mount Rubber', qty: 2000, unit_price: 3.80, currency: 'USD', total_value: 7600, eta: daysFrom(14), status: 'issued', incoterms: 'CIF', created_by: 'Admin', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'po3', po_number: 'PO-2026-003', vendor_code: 'JPN-001', vendor_name: 'Osaka Precision Mfg.', part_no: 'P-10003', part_name: 'Steering Column Shaft', qty: 100, unit_price: 87.00, currency: 'JPY', total_value: 8700, eta: daysFrom(-3), status: 'partial', incoterms: 'EXW', created_by: 'Kim Purchasing', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'po4', po_number: 'PO-2026-004', vendor_code: 'DEU-001', vendor_name: 'Bayern Automotive GmbH', part_no: 'P-10004', part_name: 'Door Hinge Assembly', qty: 400, unit_price: 24.00, currency: 'EUR', total_value: 9600, eta: daysFrom(21), status: 'draft', incoterms: 'DAP', created_by: 'Admin', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'po5', po_number: 'PO-2026-005', vendor_code: 'USA-001', vendor_name: 'Detroit Supply Corp.', part_no: 'P-10007', part_name: 'Wiring Harness Main', qty: 60, unit_price: 156.00, currency: 'USD', total_value: 9360, eta: daysFrom(-8), status: 'issued', incoterms: 'FCA', created_by: 'Kim Purchasing', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'po6', po_number: 'PO-2026-006', vendor_code: 'KOR-001', vendor_name: 'Korean Auto Parts Co.', part_no: 'P-10005', part_name: 'Brake Disc Rotor', qty: 300, unit_price: 45.00, currency: 'KRW', total_value: 13500, eta: daysFrom(10), status: 'issued', incoterms: 'FOB', created_by: 'Admin', created_at: fmt(today), updated_at: fmt(today) },
    ];

    // HQ Trade
    const hqtrade = [
        { id: 't1', shipment_no: 'SHP-2026-001', vendor_code: 'CHN-001', vendor_name: 'Shenzhen Components Ltd.', po_number: 'PO-2026-002', part_no: 'P-10002', description: 'Engine Mount Rubber', qty: 2000, unit_price: 3.80, currency: 'USD', total_value: 7600, eta: daysFrom(14), etd: daysFrom(5), status: 'in_transit', incoterms: 'CIF', hs_code: '8708.99', origin: 'CN', destination: 'KR', created_at: fmt(today), updated_at: fmt(today) },
        { id: 't2', shipment_no: 'SHP-2026-002', vendor_code: 'JPN-001', vendor_name: 'Osaka Precision Mfg.', po_number: 'PO-2026-003', part_no: 'P-10003', description: 'Steering Column Shaft', qty: 100, unit_price: 87.00, currency: 'JPY', total_value: 8700, eta: daysFrom(-3), etd: daysFrom(-18), status: 'customs', incoterms: 'EXW', hs_code: '8708.94', origin: 'JP', destination: 'KR', created_at: fmt(today), updated_at: fmt(today) },
        { id: 't3', shipment_no: 'SHP-2026-003', vendor_code: 'DEU-001', vendor_name: 'Bayern Automotive GmbH', po_number: 'PO-2026-004', part_no: 'P-10004', description: 'Door Hinge Assembly', qty: 400, unit_price: 24.00, currency: 'EUR', total_value: 9600, eta: daysFrom(21), etd: daysFrom(10), status: 'booking', incoterms: 'DAP', hs_code: '8302.10', origin: 'DE', destination: 'KR', created_at: fmt(today), updated_at: fmt(today) },
        { id: 't4', shipment_no: 'SHP-2026-004', vendor_code: 'USA-001', vendor_name: 'Detroit Supply Corp.', po_number: 'PO-2026-005', part_no: 'P-10007', description: 'Wiring Harness Main', qty: 60, unit_price: 156.00, currency: 'USD', total_value: 9360, eta: daysFrom(-8), etd: daysFrom(-22), status: 'in_transit', incoterms: 'FCA', hs_code: '8544.30', origin: 'US', destination: 'KR', created_at: fmt(today), updated_at: fmt(today) },
    ];

    // Vendor KPI
    const vendorkpi = [
        { id: 'k1', vendor_code: 'KOR-001', period: '2026-Q1', otd: 95, quality: 98, lt_compliance: 92, responsiveness: 90, overall_score: 94, remarks: 'Excellent overall', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'k2', vendor_code: 'CHN-001', period: '2026-Q1', otd: 78, quality: 85, lt_compliance: 80, responsiveness: 75, overall_score: 80, remarks: 'Quality improvement needed', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'k3', vendor_code: 'JPN-001', period: '2026-Q1', otd: 99, quality: 99, lt_compliance: 98, responsiveness: 95, overall_score: 98, remarks: 'Top performer', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'k4', vendor_code: 'DEU-001', period: '2026-Q1', otd: 88, quality: 96, lt_compliance: 85, responsiveness: 82, overall_score: 88, remarks: 'Lead time needs improvement', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'k5', vendor_code: 'USA-001', period: '2026-Q1', otd: 65, quality: 80, lt_compliance: 60, responsiveness: 70, overall_score: 69, remarks: 'At risk - action plan required', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'k6', vendor_code: 'KOR-001', period: '2025-Q4', otd: 92, quality: 97, lt_compliance: 90, responsiveness: 88, overall_score: 92, remarks: 'Good', created_at: fmt(today), updated_at: fmt(today) },
        { id: 'k7', vendor_code: 'CHN-001', period: '2025-Q4', otd: 72, quality: 82, lt_compliance: 75, responsiveness: 70, overall_score: 75, remarks: 'Declined from Q3', created_at: fmt(today), updated_at: fmt(today) },
    ];

    // Save all
    await Promise.all([
        DB.save('vendors', vendors),
        DB.save('parts', parts),
        DB.save('products', products),
        DB.save('bom', bom),
        DB.save('inventory', inventory),
        DB.save('forecast', forecast),
        DB.save('polist', polist),
        DB.save('hqtrade', hqtrade),
        DB.save('vendorkpi', vendorkpi),
    ]);

    toast('✅ 샘플 데이터 로드 완료! (5 vendors, 8 parts, 4 products ...)', 'success', 4000);
    return true;
}

// ── Vendors page search wiring (ids need adding) ───────
// Add missing ids to vendors page elements at runtime
document.addEventListener('DOMContentLoaded', () => {
    // Vendor search/sub ids
    const vSearchEl = document.querySelector('#pg-vendors .tbl-search');
    if (vSearchEl && !vSearchEl.id) { vSearchEl.id = 'vendors-search'; vSearchEl.setAttribute('oninput', "filterTable('vendors')"); }
    const vCountEl = document.querySelector('#pg-vendors .tbl-count');
    if (vCountEl && !vCountEl.id) vCountEl.id = 'vendors-count';
    const vSubEl = document.querySelector('#pg-vendors .ph-sub');
    if (vSubEl && !vSubEl.id) vSubEl.id = 'vendors-sub';
    const vTbody = document.querySelector('#pg-vendors tbody');
    if (vTbody && !vTbody.id) vTbody.id = 'vendors-tbody';
    const vPgInfo = document.querySelector('#pg-vendors .tbl-pg span');
    if (vPgInfo && !vPgInfo.id) vPgInfo.id = 'vendors-pg-info';
    const vPgBtns = document.querySelector('#pg-vendors .pg-btns');
    if (vPgBtns && !vPgBtns.id) vPgBtns.id = 'vendors-pg-btns';

    // Parts search/filter ids
    const pSearchEl = document.querySelector('#pg-parts .tbl-search');
    if (pSearchEl && !pSearchEl.id) { pSearchEl.id = 'parts-search'; pSearchEl.setAttribute('oninput', "filterTable('parts')"); }
    const pCountEl = document.querySelector('#pg-parts .tbl-count');
    if (pCountEl && !pCountEl.id) pCountEl.id = 'parts-count';
    const pSubEl = document.querySelector('#pg-parts .ph-sub');
    if (pSubEl && !pSubEl.id) pSubEl.id = 'parts-sub';
    const pTbody = document.querySelector('#pg-parts tbody');
    if (pTbody && !pTbody.id) pTbody.id = 'parts-tbody';
    const pPgInfo = document.querySelector('#pg-parts .tbl-pg span');
    if (pPgInfo && !pPgInfo.id) pPgInfo.id = 'parts-pg-info';
    const pPgBtns = document.querySelector('#pg-parts .pg-btns');
    if (pPgBtns && !pPgBtns.id) pPgBtns.id = 'parts-pg-btns';

    // Vendor filter in parts page
    const pFilterVendor = document.querySelectorAll('#pg-parts .tbl-filter')[0];
    if (pFilterVendor && !pFilterVendor.id) { pFilterVendor.id = 'parts-filter-vendor'; pFilterVendor.setAttribute('onchange', "filterTable('parts')"); }

    // Initial page render — seed sample data if DB is empty
    seedSampleData().then(() => {
        renderVendors();
        renderParts();
    });
});

console.log('%cSCM Pro — STEP 4 loaded: Forecast + MRP Engine', 'color:#FFB020;font-weight:bold');

// ══════════════════════════════════════════════════════
//  STEP 4 — FORECAST + MRP CALCULATION ENGINE
// ══════════════════════════════════════════════════════

// ── WEEK UTILITIES ─────────────────────────────────────
function getISOWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return [d.getFullYear(), Math.ceil((((d - yearStart) / 86400000) + 1) / 7)];
}

function weekKey(year, week) { return `${year}W${String(week).padStart(2, '0')}`; }

function getWeeksFrom(startDate, count) {
    const weeks = [];
    const d = new Date(startDate);
    // Move to Monday of start week
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    for (let i = 0; i < count; i++) {
        const [y, w] = getISOWeek(d);
        weeks.push({ key: weekKey(y, w), label: `W${String(w).padStart(2, '0')}`, year: y, week: w, date: new Date(d) });
        d.setDate(d.getDate() + 7);
    }
    return weeks;
}

function addDays(date, days) { const d = new Date(date); d.setDate(d.getDate() + days); return d; }

function fmtDateShort(d) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[d.getMonth()] + ' ' + d.getDate();
}

// ── FORECAST STATE ─────────────────────────────────────
let FC_WEEKS = [];
let FC_DATA = {};   // { "PARTNO::CUST": { weekKey: qty, ... } }
let FC_DIRTY = false;

// ── FORECAST RENDER ────────────────────────────────────
async function renderForecast() {
    const products = await DB.get('products');
    const fcDb = await DB.get('forecast');

    if (products.length === 0) {
        document.getElementById('fc-tbody').innerHTML = `<tr><td colspan="20"><div class="empty"><div class="empty-icon">📦</div><div class="empty-text">No products found — <span style="color:var(--cyan);cursor:pointer" onclick="nav('import')">import from template</span></div></div></td></tr>`;
        return;
    }

    // Build week list: current week - 1 ... + 15 (16 weeks default)
    const offset = parseInt(document.getElementById('fc-week-offset')?.value || 0);
    const startDate = addDays(new Date(), -7 + offset * 7);
    const NUM_WEEKS = 16;
    FC_WEEKS = getWeeksFrom(startDate, NUM_WEEKS);
    const [currentYear, currentWeek] = getISOWeek(new Date());

    // Load existing forecast data into FC_DATA
    FC_DATA = {};
    fcDb.forEach(row => {
        const k = `${row.assy_part_no}::${row.customer || ''}`;
        if (!FC_DATA[k]) FC_DATA[k] = {};
        Object.keys(row).forEach(wk => {
            if (/^\d{4}W\d{2}$/.test(wk)) FC_DATA[k][wk] = row[wk] || 0;
        });
    });

    // Filters
    const filterCust = document.getElementById('fc-filter-customer')?.value || '';
    const search = document.getElementById('fc-search')?.value.toLowerCase() || '';
    const hideZero = document.getElementById('fc-show-zeros')?.checked;

    // Update customer filter
    const custs = [...new Set(products.map(p => p.customer).filter(Boolean))].sort();
    const csel = document.getElementById('fc-filter-customer');
    if (csel) {
        const cur = csel.value;
        csel.innerHTML = '<option value="">All Customers</option>' + custs.map(c => `<option>${c}</option>`).join('');
        csel.value = cur;
    }

    // Filter products
    let filtered = products.filter(p => {
        if (filterCust && p.customer !== filterCust) return false;
        if (search && !(p.part_no + p.part_name + p.customer).toLowerCase().includes(search)) return false;
        return true;
    });

    if (hideZero) {
        filtered = filtered.filter(p => {
            const k = `${p.part_no}::${p.customer || ''}`;
            return FC_WEEKS.some(w => (FC_DATA[k]?.[w.key] || 0) > 0);
        });
    }

    // Build header
    const thead = document.getElementById('fc-thead');
    thead.innerHTML = `
    <th class="sticky-col fc-week-header" style="text-align:left;padding:8px 12px">Product</th>
    <th class="sticky-col2 fc-week-header" style="text-align:left;padding:8px 10px">Customer</th>
    ${FC_WEEKS.map(w => {
        const isCur = w.year === currentYear && w.week === currentWeek;
        const isPast = (w.year < currentYear) || (w.year === currentYear && w.week < currentWeek);
        return `<th class="fc-week-header ${isCur ? 'current' : isPast ? 'past' : ''}" title="${w.date.toISOString().slice(0, 10)}">${w.label}</th>`;
    }).join('')}
    <th class="fc-week-header" style="text-align:right;padding:8px 10px;background:var(--bg1);border-left:2px solid var(--bd)">Total</th>`;

    // Build rows
    let totalThisWeek = 0, total4Wk = 0, totalAll = 0;
    const curWkKey = weekKey(currentYear, currentWeek);

    const rows = filtered.map(p => {
        const k = `${p.part_no}::${p.customer || ''}`;
        if (!FC_DATA[k]) FC_DATA[k] = {};

        const weekVals = FC_WEEKS.map(w => FC_DATA[k][w.key] || 0);
        const rowTotal = weekVals.reduce((s, v) => s + v, 0);
        const thisWkIdx = FC_WEEKS.findIndex(w => w.key === curWkKey);
        const thisWkVal = thisWkIdx >= 0 ? weekVals[thisWkIdx] : 0;
        const next4 = weekVals.slice(Math.max(0, thisWkIdx), thisWkIdx + 4).reduce((s, v) => s + v, 0);

        totalThisWeek += thisWkVal;
        total4Wk += next4;
        totalAll += rowTotal;

        const escapedP = JSON.stringify(p).replace(/"/g, '&quot;');
        const weekCells = FC_WEEKS.map((w, i) => {
            const val = weekVals[i];
            const isCur = w.year === currentYear && w.week === currentWeek;
            return `<td class="fc-cell-week${isCur ? ' current' : ''}"><input type="number" min="0" step="1" value="${val || ''}" placeholder="0" class="${val ? 'has-val' : ''}" data-part="${p.part_no}" data-cust="${p.customer || ''}" data-week="${w.key}" onchange="fcUpdateCell(this)" onfocus="this.select()"></td>`;
        }).join('');

        return `<tr>
      <td class="fc-cell-product">${p.part_no}</td>
      <td class="fc-cell-customer">${p.customer || '—'}</td>
      ${weekCells}
      <td class="fc-cell-total">${rowTotal > 0 ? fmt2(rowTotal) : '<span style="color:var(--t3)">—</span>'}</td>
    </tr>`;
    });

    document.getElementById('fc-tbody').innerHTML = rows.join('') || `<tr><td colspan="${NUM_WEEKS + 3}"><div class="empty"><div class="empty-icon">📈</div><div class="empty-text">No products match filter</div></div></td></tr>`;
    document.getElementById('fc-row-count').textContent = `${filtered.length} products`;
    document.getElementById('fc-sub').textContent = `${filtered.length} products · ${NUM_WEEKS}-week horizon`;

    // KPI strip
    document.getElementById('fc-kpi-products').textContent = filtered.length;
    document.getElementById('fc-kpi-thisweek').textContent = fmt2(totalThisWeek);
    document.getElementById('fc-kpi-4wk').textContent = fmt2(Math.round(total4Wk / 4));
    document.getElementById('fc-kpi-total').textContent = fmt2(totalAll);
    document.getElementById('fc-kpi-custs').textContent = custs.length;
}

function fcUpdateCell(input) {
    const part = input.dataset.part;
    const cust = input.dataset.cust;
    const week = input.dataset.week;
    const val = parseInt(input.value) || 0;
    const k = `${part}::${cust}`;
    if (!FC_DATA[k]) FC_DATA[k] = {};
    FC_DATA[k][week] = val;
    input.classList.toggle('has-val', val > 0);
    // Update row total
    const row = input.closest('tr');
    if (row) {
        const inputs = row.querySelectorAll('input[type=number]');
        let total = 0;
        inputs.forEach(inp => total += parseInt(inp.value) || 0);
        const totalCell = row.querySelector('.fc-cell-total');
        if (totalCell) totalCell.innerHTML = total > 0 ? fmt2(total) : '<span style="color:var(--t3)">—</span>';
    }
    FC_DIRTY = true;
    saveForecastDebounced();
}

let fcSaveTimer = null;
function saveForecastDebounced() {
    clearTimeout(fcSaveTimer);
    fcSaveTimer = setTimeout(saveForecast, 1500);
}

async function saveForecast() {
    if (!FC_DIRTY) return;
    const products = await DB.get('products');
    const rows = [];
    for (const [k, weekData] of Object.entries(FC_DATA)) {
        const [partNo, cust] = k.split('::');
        const prod = products.find(p => p.part_no === partNo);
        if (!prod) continue;
        const hasData = Object.values(weekData).some(v => v > 0);
        if (!hasData) continue;
        const row = { id: k, assy_part_no: partNo, customer: cust, ...weekData };
        rows.push(row);
    }
    await DB.save('forecast', rows);
    FC_DIRTY = false;
    toast('Forecast saved', 'success', 1500);
}

async function exportForecast() {
    await saveForecast();
    exportTable('forecast');
}

// ══════════════════════════════════════════════════════
//  MRP ENGINE
// ══════════════════════════════════════════════════════
let MRP_RESULTS = [];

async function runMRP() {
    toast('Running MRP...', 'info', 1500);

    const parts = await DB.get('parts');
    const products = await DB.get('products');
    const bom = await DB.get('bom');
    const inventory = await DB.get('inventory');
    const forecast = await DB.get('forecast');

    if (parts.length === 0 || bom.length === 0) {
        toast('No parts or BOM data — please import first', 'warn');
        nav('mrp');
        document.getElementById('mrp-tbody').innerHTML = `<tr><td colspan="13"><div class="empty"><div class="empty-icon">📦</div><div class="empty-text">No master data. <span style="color:var(--cyan);cursor:pointer" onclick="nav('import')">Import from template first.</span></div></div></td></tr>`;
        return;
    }

    const horizon = parseInt(document.getElementById('mrp-horizon')?.value || 16);
    const today = new Date();

    // ── Step 1: Build weekly demand per product ───────────
    // Sum forecast data over horizon weeks
    const startDate = addDays(today, -7); // include current week
    const horizonWeeks = getWeeksFrom(startDate, horizon + 1);
    const horizonKeys = new Set(horizonWeeks.map(w => w.key));

    const productDemand = {}; // { partNo: totalQty }
    forecast.forEach(row => {
        const partNo = row.assy_part_no;
        if (!productDemand[partNo]) productDemand[partNo] = 0;
        Object.entries(row).forEach(([k, v]) => {
            if (horizonKeys.has(k)) productDemand[partNo] += (parseInt(v) || 0);
        });
    });

    // ── Step 2: BOM explosion → part demand ──────────────
    const partDemand = {}; // { partNo: { demand, from: [{assy, qty}] } }
    bom.forEach(row => {
        const assyDemand = productDemand[row.assy_part_no] || 0;
        if (assyDemand === 0) return;
        const totalPartNeed = assyDemand * (parseInt(row.qty) || 1);
        if (!partDemand[row.part_no]) partDemand[row.part_no] = { demand: 0, from: [] };
        partDemand[row.part_no].demand += totalPartNeed;
        partDemand[row.part_no].from.push({ assy: row.assy_part_no, qty: row.qty, total: totalPartNeed });
    });

    // ── Step 3: Inventory lookup ──────────────────────────
    const invMap = {}; // { partNo: { onhand, intransit, vmi } }
    inventory.forEach(row => {
        if (!invMap[row.part_no]) invMap[row.part_no] = { onhand: 0, intransit: 0, vmi: 0, eta: '' };
        const loc = (row.location || '').toLowerCase();
        const qty = parseInt(row.qty) || 0;
        if (loc === 'onhand') invMap[row.part_no].onhand += qty;
        if (loc === 'intransit') invMap[row.part_no].intransit += qty;
        if (loc === 'vmi') invMap[row.part_no].vmi += qty;
    });

    // ── Step 4: Calculate net position per part ───────────
    MRP_RESULTS = parts.map(part => {
        const inv = invMap[part.part_no] || { onhand: 0, intransit: 0, vmi: 0 };
        const safetyStockNum = parseInt(part.safety_stock) || 0;
        const demand = partDemand[part.part_no]?.demand || 0;
        const available = inv.onhand + inv.intransit + inv.vmi;
        const netPosition = available - demand - safetyStockNum;
        const moq = parseInt(part.moq) || 1;
        const leadTimeDays = parseInt(part.leadtime_mp) || 0;

        // Required order qty (round up to MOQ multiple)
        let orderQty = 0;
        if (netPosition < 0) {
            const needed = Math.abs(netPosition);
            orderQty = Math.ceil(needed / moq) * moq;
        }

        // Order by date = first demand date that would be short minus lead time
        const latestOrderDate = addDays(today, -leadTimeDays + (horizon * 7));
        const orderByDate = addDays(today, -(leadTimeDays - 1));
        const isPastOrderBy = orderByDate < today;

        // Status classification
        let status = 'ok';
        if (netPosition < 0) {
            status = isPastOrderBy ? 'impossible' : 'shortage';
        } else if (demand > 0 && available <= safetyStockNum * 1.2) {
            status = 'warning';
        }

        return {
            ...part,
            onhand: inv.onhand,
            intransit: inv.intransit,
            vmi: inv.vmi,
            safety_stock_num: safetyStockNum,
            demand,
            net_position: netPosition,
            order_qty: orderQty,
            order_by_date: orderByDate,
            is_past_order_by: isPastOrderBy,
            status,
            from: partDemand[part.part_no]?.from || [],
        };
    });

    nav('mrp');
    renderMRP();
    updateDashboardKPIs();
}

// ══════════════════════════════════════════════════════
//  STEP 7 — DASHBOARD LIVE DATA + VENDOR KPI + ALERTS
// ══════════════════════════════════════════════════════

// ── DASHBOARD LIVE RENDER ─────────────────────────────
async function renderDashboard() {
    const [pos, trades, inventory, parts, alerts] = await Promise.all([
        DB.get('polist'), DB.get('hqtrade'), DB.get('inventory'),
        DB.get('parts'), DB.get('alerts')
    ]);

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // ── KPI strip ──
    const openPOs = pos.filter(p => ['issued', 'partial'].includes(p.status));
    const inTransit = trades.filter(t => t.status === 'in_transit');
    const poValue = openPOs.reduce((s, p) => s + (parseFloat(p.total_value) || 0), 0);

    const el = id => document.getElementById(id);
    if (el('dash-open-po')) el('dash-open-po').textContent = openPOs.length;
    if (el('dash-open-po-delta')) el('dash-open-po-delta').textContent = poValue > 0 ? `$${fmt2(poValue, 0)} total value` : 'No open POs';
    if (el('dash-in-transit')) el('dash-in-transit').textContent = inTransit.length;
    if (el('dash-transit-delta')) el('dash-transit-delta').textContent = inTransit.length > 0 ? `${inTransit.length} shipments en route` : 'No active shipments';

    // MRP-driven KPIs
    const shortage = MRP_RESULTS.filter(r => r.status === 'shortage').length;
    const impossible = MRP_RESULTS.filter(r => r.status === 'impossible').length;
    if (el('dash-shortage')) el('dash-shortage').textContent = MRP_RESULTS.length > 0 ? shortage : '—';
    if (el('dash-impossible')) el('dash-impossible').textContent = MRP_RESULTS.length > 0 ? impossible : '—';
    if (el('dash-shortage-delta')) el('dash-shortage-delta').textContent = MRP_RESULTS.length > 0 ? (shortage > 0 ? '⚠ Immediate action required' : '✓ All parts sufficient') : 'Run MRP to calculate';
    if (el('dash-impossible-delta')) el('dash-impossible-delta').textContent = MRP_RESULTS.length > 0 ? (impossible > 0 ? 'Lead time exceeded' : '✓ None') : '—';

    // Alert badge
    const critAlerts = alerts ? alerts.filter(a => !a.read && a.severity === 'critical').length : 0;
    const abEl = el('dash-alert-badge');
    if (abEl) { abEl.style.display = critAlerts > 0 ? '' : 'none'; abEl.textContent = critAlerts; }

    // ── Shortage table ──
    const shortageEl = el('dash-shortage-tbody');
    if (shortageEl) {
        const items = MRP_RESULTS.filter(r => ['impossible', 'shortage', 'warning'].includes(r.status)).slice(0, 6);
        if (items.length > 0) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            shortageEl.innerHTML = items.map(r => {
                const badge = r.status === 'impossible' ? `<span class="badge badge-r">Impossible PO</span>`
                    : r.status === 'shortage' ? `<span class="badge badge-r">Shortage</span>`
                        : `<span class="badge badge-a">Warning</span>`;
                const orderBy = r.order_by_date ? months[r.order_by_date.getMonth()] + ' ' + r.order_by_date.getDate() : '—';
                return `<tr onclick="nav('mrp')" style="cursor:pointer">
                            <td class="mono tc">${r.part_no}</td>
                            <td class="tx">${r.part_name || '—'}</td>
                            <td class="nn ri mono">${fmt2(r.net_position)}</td>
                            <td class="mono">${orderBy}</td>
                            <td class="mono mu">${r.leadtime_mp ? r.leadtime_mp + 'd' : '—'}</td>
                            <td>${badge}</td>
                        </tr>`;
            }).join('');
        } else if (MRP_RESULTS.length > 0) {
            shortageEl.innerHTML = `<tr><td colspan="6"><div class="empty" style="padding:20px 0">
                        <div class="empty-icon">✅</div><div class="empty-text">All ${MRP_RESULTS.length} parts sufficient</div>
                    </div></td></tr>`;
        }
    }

    // ── In Transit list ──
    const transitEl = el('dash-transit-list');
    if (transitEl) {
        if (inTransit.length > 0) {
            transitEl.innerHTML = inTransit.slice(0, 5).map(t => {
                const etaDays = t.eta ? Math.round((new Date(t.eta) - today) / 86400000) : null;
                const etaClass = etaDays === null ? 'c' : etaDays < 0 ? 'r' : etaDays <= 7 ? 'g' : 'a';
                const badge = etaDays === null ? `<span class="badge badge-m">—</span>`
                    : etaDays < 0 ? `<span class="badge badge-r">Overdue</span>`
                        : etaDays <= 3 ? `<span class="badge badge-g">Arriving</span>`
                            : etaDays <= 14 ? `<span class="badge badge-c">On Time</span>`
                                : `<span class="badge badge-a">En Route</span>`;
                return `<div class="ai" onclick="nav('hqtrade')" style="cursor:pointer">
                            <div class="ai-icon ${etaClass}">🚢</div>
                            <div style="flex:1">
                                <div class="ai-title">${t.shipment_no} · ${t.qty ? fmt2(t.qty) + ' pcs' : ''}</div>
                                <div class="ai-detail">${t.vendor_code || '—'} · ETA ${t.eta || '—'}</div>
                            </div>${badge}
                        </div>`;
            }).join('');
        } else {
            transitEl.innerHTML = `<div class="empty" style="padding:20px 0"><div class="empty-icon">🚢</div><div class="empty-text">No shipments in transit</div></div>`;
        }
    }

    // ── PO Summary ──
    const poEl = el('dash-po-summary');
    if (poEl && pos.length > 0) {
        const byStatus = {};
        pos.forEach(p => { byStatus[p.status] = (byStatus[p.status] || 0) + 1; });
        const totalVal = pos.reduce((s, p) => s + (parseFloat(p.total_value) || 0), 0);
        poEl.innerHTML = `
                    <div style="text-align:center;padding:8px 0 12px">
                        <div style="font-family:var(--fm);font-size:28px;font-weight:800;color:var(--cyan)">$${fmt2(totalVal, 0)}</div>
                        <div style="font-size:11px;color:var(--t3);margin-top:2px">${pos.length} total POs</div>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:8px;font-size:11px">
                        ${Object.entries(byStatus).map(([s, n]) => `
                        <div class="fib">
                            <span class="tm" style="text-transform:capitalize">${s.replace('_', ' ')}</span>
                            <span class="mono">${n}</span>
                        </div>`).join('')}
                    </div>`;
    } else if (poEl) {
        poEl.innerHTML = `<div class="empty" style="padding:20px 0"><div class="empty-icon">📋</div><div class="empty-text"><span style="color:var(--cyan);cursor:pointer" onclick="nav('poplan')">Create POs</span> from MRP shortage</div></div>`;
    }

    // ── Vendor KPI mini ──
    renderDashVendorKPI(pos);

    // ── Activity ──
    renderDashActivity(pos, trades);

    // Dashboard subtitle
    const phSub = document.querySelector('#pg-dashboard .ph-sub');
    if (phSub) phSub.innerHTML = `Last updated: ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · <span class="dash-live-badge"><span class="dash-live-dot"></span>LIVE</span>`;
}

async function renderDashVendorKPI(pos) {
    const kpiEl = document.getElementById('dash-vendor-kpi-list');
    if (!kpiEl) return;
    const kpiLogs = await DB.get('vendorkpi');
    if (!kpiLogs || kpiLogs.length === 0) {
        // Fall back to PO-derived OTD
        if (!pos || pos.length === 0) return;
        const byVendor = {};
        pos.filter(p => p.status === 'received').forEach(p => {
            const v = p.vendor_code; if (!v) return;
            if (!byVendor[v]) byVendor[v] = { total: 0, onTime: 0 };
            byVendor[v].total++;
            if ((parseInt(p.progress) || 0) >= 100) byVendor[v].onTime++;
        });
        const vendors = Object.entries(byVendor).slice(0, 5);
        if (!vendors.length) return;
        kpiEl.innerHTML = `<div class="kpi-mini-strip">${vendors.map(([v, d]) => {
            const pct = d.total > 0 ? Math.round(d.onTime / d.total * 100) : 0;
            const col = pct >= 90 ? 'var(--green)' : pct >= 75 ? 'var(--amber)' : 'var(--red)';
            return `<div class="kpi-mini-row">
                        <div class="kpi-mini-vendor">${v}</div>
                        <div style="flex:1;height:5px;background:var(--bg0);border-radius:99px;overflow:hidden">
                            <div style="width:${pct}%;height:100%;background:${col};border-radius:99px"></div>
                        </div>
                        <div class="kpi-mini-score" style="color:${col}">${pct}%</div>
                    </div>`;
        }).join('')}</div>`;
        return;
    }
    // Aggregate KPI logs by vendor
    const byV = {};
    kpiLogs.forEach(k => {
        const v = k.vendor_code; if (!v) return;
        if (!byV[v]) byV[v] = { otd: [], quality: [], lt: [] };
        byV[v].otd.push(parseFloat(k.otd) || 0);
        byV[v].quality.push(parseFloat(k.quality) || 0);
        byV[v].lt.push(parseFloat(k.lt_compliance) || 0);
    });
    kpiEl.innerHTML = `<div class="kpi-mini-strip">${Object.entries(byV).slice(0, 5).map(([v, d]) => {
        const avg = arr => arr.length ? Math.round(arr.reduce((s, x) => s + x, 0) / arr.length) : 0;
        const score = Math.round((avg(d.otd) * 0.5 + avg(d.quality) * 0.3 + avg(d.lt) * 0.2));
        const col = score >= 90 ? 'var(--green)' : score >= 75 ? 'var(--amber)' : 'var(--red)';
        return `<div class="kpi-mini-row">
                    <div class="kpi-mini-vendor">${v}</div>
                    <div style="flex:1;height:5px;background:var(--bg0);border-radius:99px;overflow:hidden">
                        <div style="width:${score}%;height:100%;background:${col};border-radius:99px"></div>
                    </div>
                    <div class="kpi-mini-score" style="color:${col}">${score}</div>
                </div>`;
    }).join('')}</div>`;
}

function renderDashActivity(pos, trades) {
    const actEl = document.getElementById('dash-activity-list');
    if (!actEl) return;
    const items = [];
    pos.slice(0, 3).forEach(p => {
        items.push({
            icon: p.status === 'received' ? '✅' : p.status === 'issued' ? '📤' : '📋',
            cls: p.status === 'received' ? 'g' : p.status === 'issued' ? 'c' : 'a',
            title: `${p.po_number} — ${p.status}`,
            detail: `${p.vendor_code || '—'} · $${fmt2(p.total_value || 0, 0)}`,
            time: p.updated_at || p.date || '',
        });
    });
    trades.slice(0, 2).forEach(t => {
        items.push({
            icon: t.status === 'delivered' ? '✅' : '🚢',
            cls: t.status === 'delivered' ? 'g' : 'c',
            title: `${t.shipment_no} — ${t.status}`,
            detail: `${t.vendor_code || '—'} · ETA ${t.eta || '—'}`,
            time: t.updated_at || t.etd || '',
        });
    });
    items.sort((a, b) => b.time.localeCompare(a.time));
    if (!items.length) {
        actEl.innerHTML = `<div class="empty" style="padding:20px 0"><div class="empty-icon">🕐</div><div class="empty-text">No recent activity</div></div>`;
        return;
    }
    const fmtAge = ts => {
        if (!ts) return '—';
        const d = new Date(ts); const now = new Date();
        const diff = Math.floor((now - d) / 60000);
        if (diff < 60) return diff + 'm ago';
        if (diff < 1440) return Math.floor(diff / 60) + 'h ago';
        return Math.floor(diff / 1440) + 'd ago';
    };
    actEl.innerHTML = items.slice(0, 5).map(i => `
                <div class="ai">
                    <div class="ai-icon ${i.cls}">${i.icon}</div>
                    <div style="flex:1">
                        <div class="ai-title">${i.title}</div>
                        <div class="ai-detail">${i.detail}</div>
                    </div>
                    <div class="ai-time">${fmtAge(i.time)}</div>
                </div>`).join('');
}

// ── VENDOR KPI PAGE ───────────────────────────────────
function kpiGrade(score) {
    if (score >= 95) return { label: 'S — Excellent', stars: '★★★★★', color: 'var(--green)', hint: 'Outstanding vendor performance' };
    if (score >= 85) return { label: 'A — Good', stars: '★★★★☆', color: 'var(--cyan)', hint: 'Above expectations' };
    if (score >= 75) return { label: 'B — Acceptable', stars: '★★★☆☆', color: 'var(--amber)', hint: 'Meets minimum requirements' };
    if (score >= 60) return { label: 'C — Warning', stars: '★★☆☆☆', color: '#FF8040', hint: 'Improvement plan required' };
    return { label: 'D — Critical', stars: '★☆☆☆☆', color: 'var(--red)', hint: 'Immediate corrective action' };
}

function calcKPIGrade() {
    const otd = parseFloat(document.getElementById('dkpi-otd')?.value) || 0;
    const qual = parseFloat(document.getElementById('dkpi-quality')?.value) || 0;
    const lt = parseFloat(document.getElementById('dkpi-lt')?.value) || 0;
    const resp = parseFloat(document.getElementById('dkpi-resp')?.value) || 0;
    const score = Math.round(otd * 0.4 + qual * 0.3 + lt * 0.2 + resp * 0.1);
    const g = kpiGrade(score);
    const scoreEl = document.getElementById('dkpi-grade-score');
    const labelEl = document.getElementById('dkpi-grade-label');
    const starsEl = document.getElementById('dkpi-grade-stars');
    const hintEl = document.getElementById('dkpi-grade-hint');
    if (scoreEl) scoreEl.textContent = score;
    if (labelEl) { labelEl.textContent = g.label; labelEl.style.color = g.color; }
    if (starsEl) { starsEl.textContent = g.stars; starsEl.style.color = g.color; }
    if (hintEl) hintEl.textContent = g.hint;
}

async function prepKPIPanel(mode, data) {
    const isNew = mode === 'new';
    document.getElementById('dp-kpi-title').textContent = isNew ? 'Log KPI Entry' : 'Edit KPI Entry';
    document.getElementById('dkpi-delete-btn').style.display = isNew ? 'none' : '';
    const vendors = await DB.get('vendors');
    const vsel = document.getElementById('dkpi-vendor');
    vsel.innerHTML = '<option value="">— Select Vendor —</option>' + vendors.map(v => `<option value="${v.vendor_code}">${v.vendor_code} — ${v.vendor_name}</option>`).join('');
    const pos = await DB.get('polist');
    const psel = document.getElementById('dkpi-po');
    psel.innerHTML = '<option value="">— Link PO (optional) —</option>' + pos.map(p => `<option value="${p.po_number}">${p.po_number}</option>`).join('');
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
    set('dkpi-id', data?.id || '');
    set('dkpi-date', data?.date || new Date().toISOString().slice(0, 10));
    set('dkpi-shipment', data?.shipment_ref || '');
    set('dkpi-notes', data?.notes || '');
    if (data?.vendor_code) vsel.value = data.vendor_code;
    if (data?.po_ref) psel.value = data.po_ref;
    ['otd', 'quality', 'lt', 'resp'].forEach(k => {
        const sl = document.getElementById(`dkpi-${k}`);
        const vl = document.getElementById(`dkpi-${k}-val`);
        const val = data?.[k === 'lt' ? 'lt_compliance' : k === 'resp' ? 'responsiveness' : k] ?? 100;
        if (sl) sl.value = val;
        if (vl) vl.textContent = val;
    });
    calcKPIGrade();
}

async function saveKPIEntry() {
    const vendor = document.getElementById('dkpi-vendor')?.value;
    const date = document.getElementById('dkpi-date')?.value;
    if (!vendor || !date) { toast('Vendor와 Date는 필수입니다', 'error'); return; }
    const otd = parseFloat(document.getElementById('dkpi-otd')?.value) || 0;
    const qual = parseFloat(document.getElementById('dkpi-quality')?.value) || 0;
    const lt = parseFloat(document.getElementById('dkpi-lt')?.value) || 0;
    const resp = parseFloat(document.getElementById('dkpi-resp')?.value) || 0;
    const score = Math.round(otd * 0.4 + qual * 0.3 + lt * 0.2 + resp * 0.1);
    const rec = {
        id: document.getElementById('dkpi-id').value || Date.now().toString(),
        vendor_code: vendor,
        date,
        po_ref: document.getElementById('dkpi-po')?.value || '',
        shipment_ref: document.getElementById('dkpi-shipment')?.value.trim() || '',
        otd,
        quality: qual,
        lt_compliance: lt,
        responsiveness: resp,
        overall_score: score,
        grade: kpiGrade(score).label.split(' — ')[0],
        notes: document.getElementById('dkpi-notes')?.value.trim() || '',
    };
    await DB.upsert('vendorkpi', rec, 'id');
    toast(`KPI 저장됨 — ${vendor} 종합점수 ${score}`, 'success');
    closeDP();
    renderVendorKPI();
}

async function deleteKPIEntry() {
    const id = document.getElementById('dkpi-id')?.value;
    if (!id) return;
    const ok = await confirm('KPI 기록 삭제', 'KPI 기록을 삭제합니다.', '삭제', true);
    if (!ok) return;
    await DB.delete('vendorkpi', id);
    toast('삭제됨', 'warn'); closeDP(); renderVendorKPI();
}

function kpiRingHTML(score, size = 88) {
    const r = (size / 2) - 8;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    const col = score >= 90 ? '#00E5A0' : score >= 75 ? '#FFB020' : '#FF4560';
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--bd)" stroke-width="8"/>
                <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="8"
                    stroke-dasharray="${dash.toFixed(1)} ${circ.toFixed(1)}" stroke-linecap="round"/>
            </svg>`;
}

async function renderVendorKPI() {
    const logs = await DB.get('vendorkpi');
    const vendors = await DB.get('vendors');

    // Vendor filter dropdown
    const vf = document.getElementById('kpi-filter-vendor');
    if (vf) {
        const vcs = [...new Set(logs.map(l => l.vendor_code).filter(Boolean))].sort();
        const cur = vf.value;
        vf.innerHTML = '<option value="">All Vendors</option>' + vcs.map(v => `<option>${v}</option>`).join('');
        vf.value = cur;
    }

    // Aggregate by vendor
    const byVendor = {};
    logs.forEach(l => {
        const v = l.vendor_code; if (!v) return;
        if (!byVendor[v]) byVendor[v] = { otd: [], quality: [], lt: [], resp: [], scores: [], logs: [] };
        byVendor[v].otd.push(parseFloat(l.otd) || 0);
        byVendor[v].quality.push(parseFloat(l.quality) || 0);
        byVendor[v].lt.push(parseFloat(l.lt_compliance) || 0);
        byVendor[v].resp.push(parseFloat(l.responsiveness) || 0);
        byVendor[v].scores.push(parseFloat(l.overall_score) || 0);
        byVendor[v].logs.push(l);
    });

    const avg = arr => arr.length ? Math.round(arr.reduce((s, x) => s + x, 0) / arr.length) : null;
    const vList = Object.entries(byVendor);

    // Summary KPIs
    const allScores = vList.map(([, d]) => avg(d.scores)).filter(s => s != null);
    const avgOTD = avg(vList.flatMap(([, d]) => d.otd));
    const avgQual = avg(vList.flatMap(([, d]) => d.quality));
    const avgLT = avg(vList.flatMap(([, d]) => d.lt));
    const atRisk = vList.filter(([, d]) => avg(d.scores) < 75).length;
    const el = id => document.getElementById(id);
    if (el('kpi-avg-otd')) el('kpi-avg-otd').textContent = avgOTD != null ? avgOTD + '%' : '—';
    if (el('kpi-avg-quality')) el('kpi-avg-quality').textContent = avgQual != null ? avgQual + '%' : '—';
    if (el('kpi-avg-lt')) el('kpi-avg-lt').textContent = avgLT != null ? avgLT + '%' : '—';
    if (el('kpi-at-risk')) el('kpi-at-risk').textContent = atRisk;
    if (el('kpi-count')) el('kpi-count').textContent = vList.length;
    if (el('kpi-sub')) el('kpi-sub').textContent = `${logs.length} KPI records · ${vList.length} vendors tracked`;

    // Cards
    const grid = el('kpi-cards-grid');
    if (grid) {
        if (!vList.length) {
            grid.innerHTML = `<div style="grid-column:1/-1"><div class="empty"><div class="empty-icon">🎯</div>
                        <div class="empty-text">No KPI data — <span style="color:var(--cyan);cursor:pointer" onclick="openDP('dp-kpi-entry','new')">Log first entry</span></div>
                    </div></div>`;
        } else {
            grid.innerHTML = vList.sort((a, b) => (avg(b[1].scores) || 0) - (avg(a[1].scores) || 0)).map(([vendor, d]) => {
                const score = avg(d.scores) ?? 0;
                const g = kpiGrade(score);
                const vendorInfo = vendors.find(v => v.vendor_code === vendor);
                const criteria = [
                    { label: 'OTD', val: avg(d.otd), color: 'var(--cyan)', weight: '40%' },
                    { label: 'Quality', val: avg(d.quality), color: 'var(--green)', weight: '30%' },
                    { label: 'Lead Time', val: avg(d.lt), color: 'var(--amber)', weight: '20%' },
                    { label: 'Responsiveness', val: avg(d.resp), color: 'var(--t2)', weight: '10%' },
                ];
                return `<div class="card">
                            <div class="card-hdr">
                                <div>
                                    <div class="card-title">${vendor}</div>
                                    <div style="font-size:11px;color:var(--t3)">${vendorInfo?.vendor_name || ''} · ${d.logs.length} entries</div>
                                </div>
                                <button class="btn btn-g btn-sm" onclick="openDP('dp-kpi-entry','new')">+ Log</button>
                            </div>
                            <div class="card-body">
                                <div class="kpi-ring-wrap">
                                    <div class="kpi-ring">
                                        ${kpiRingHTML(score)}
                                        <div class="kpi-ring-val">
                                            <span style="color:${g.color}">${score}</span>
                                            <span class="kpi-ring-lbl">${g.label.split(' — ')[0]}</span>
                                        </div>
                                    </div>
                                    <div class="kpi-criteria">
                                        ${criteria.map(c => `
                                        <div class="kpi-crit-row">
                                            <div class="kpi-crit-label">${c.label} <span style="color:var(--t3);font-size:10px">${c.weight}</span></div>
                                            <div class="kpi-crit-bar"><div class="kpi-crit-fill" style="width:${c.val ?? 0}%;background:${c.color}"></div></div>
                                            <div class="kpi-crit-val" style="color:${c.color}">${c.val != null ? c.val + '%' : '—'}</div>
                                        </div>`).join('')}
                                    </div>
                                </div>
                                <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-top:1px solid var(--bd);margin-top:8px">
                                    <div class="stars" style="color:${g.color}">${g.stars}</div>
                                    <div style="font-size:11px;color:${g.color};font-weight:600">${g.hint}</div>
                                </div>
                            </div>
                        </div>`;
            }).join('');
        }
    }
    renderKPITable();
}

async function renderKPITable() {
    const logs = await DB.get('vendorkpi');
    const vf = document.getElementById('kpi-filter-vendor')?.value || '';
    const filtered = vf ? logs.filter(l => l.vendor_code === vf) : logs;
    filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const tbody = document.getElementById('kpi-log-tbody');
    if (!tbody) return;
    tbody.innerHTML = filtered.map(l => {
        const g = kpiGrade(l.overall_score || 0);
        const esc = JSON.stringify(l).replace(/"/g, '&quot;');
        return `<tr onclick="openDP('dp-kpi-entry','edit',${esc})" style="cursor:pointer">
                    <td class="mono">${l.date || '—'}</td>
                    <td class="tx fw">${l.vendor_code || '—'}</td>
                    <td class="mono mu">${l.po_ref || '—'}</td>
                    <td class="mono ri" style="color:var(--cyan)">${l.otd != null ? l.otd + '%' : '—'}</td>
                    <td class="mono ri" style="color:var(--green)">${l.quality != null ? l.quality + '%' : '—'}</td>
                    <td class="mono ri" style="color:var(--amber)">${l.lt_compliance != null ? l.lt_compliance + '%' : '—'}</td>
                    <td class="mono ri fw" style="color:${g.color}">${l.overall_score || '—'}</td>
                    <td><span class="badge" style="background:${g.color}22;color:${g.color};border:1px solid ${g.color}55">${l.grade || '—'}</span></td>
                    <td class="tx mu" style="font-size:11px">${l.notes || ''}</td>
                    <td><button class="btn btn-g btn-sm btn-ic" onclick="event.stopPropagation();openDP('dp-kpi-entry','edit',${esc})">✏️</button></td>
                </tr>`;
    }).join('') || `<tr><td colspan="10"><div class="empty"><div class="empty-icon">🎯</div>
                <div class="empty-text">No KPI records for this vendor</div></div></td></tr>`;
}

async function exportVendorKPI() {
    const logs = await DB.get('vendorkpi');
    if (!logs.length) { toast('No KPI data', 'warn'); return; }
    if (!window.XLSX) await loadXLSX();
    const ws = XLSX.utils.json_to_sheet(logs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vendor_KPI');
    XLSX.writeFile(wb, `Vendor_KPI_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast('Exported', 'success');
}

// ── ALERT CENTER ──────────────────────────────────────
let ALERTS = [];
let ALERT_FILTER = 'all';

async function generateAlerts() {
    const [parts, inventory, pos, trades, forecast, kpis] = await Promise.all([
        DB.get('parts'), DB.get('inventory'), DB.get('polist'),
        DB.get('hqtrade'), DB.get('forecast'), DB.get('vendorkpi')
    ]);
    const newAlerts = [];
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    let id = Date.now();

    // 1. MRP Shortage alerts
    MRP_RESULTS.filter(r => r.status === 'impossible').forEach(r => {
        newAlerts.push({
            id: (id++).toString(), type: 'mrp', severity: 'critical', read: false,
            title: `Impossible PO — ${r.part_no}`,
            desc: `${r.part_name || r.part_no} 재고 부족 ${fmt2(Math.abs(r.net_position))} pcs. 리드타임 초과로 정상 발주 불가.`,
            meta: `Vendor: ${r.vendor_code || '—'} · LT: ${r.leadtime_mp}d`,
            action: 'poplan', actionLabel: 'PO Planning', created_at: todayStr,
        });
    });
    MRP_RESULTS.filter(r => r.status === 'shortage').forEach(r => {
        newAlerts.push({
            id: (id++).toString(), type: 'mrp', severity: 'critical', read: false,
            title: `Shortage — ${r.part_no}`,
            desc: `${r.part_name || r.part_no} 부족: ${fmt2(Math.abs(r.net_position))} pcs. 발주 필요.`,
            meta: `Vendor: ${r.vendor_code || '—'} · Order By: ${r.order_by_date?.toISOString().slice(0, 10) || 'ASAP'}`,
            action: 'poplan', actionLabel: 'Issue PO', created_at: todayStr,
        });
    });
    MRP_RESULTS.filter(r => r.status === 'warning').forEach(r => {
        newAlerts.push({
            id: (id++).toString(), type: 'mrp', severity: 'warning', read: false,
            title: `Low Stock Warning — ${r.part_no}`,
            desc: `${r.part_name || r.part_no} 안전재고 임박. Net: ${fmt2(r.net_position)} pcs.`,
            meta: `Vendor: ${r.vendor_code || '—'}`,
            action: 'poplan', actionLabel: 'Plan PO', created_at: todayStr,
        });
    });

    // 2. PO ETA overdue
    pos.filter(p => ['issued', 'partial'].includes(p.status) && p.eta && p.eta < todayStr).forEach(p => {
        const days = Math.round((now - new Date(p.eta)) / 86400000);
        newAlerts.push({
            id: (id++).toString(), type: 'po', severity: 'warning', read: false,
            title: `PO Overdue — ${p.po_number}`,
            desc: `ETA ${p.eta}로부터 ${days}일 경과. 납기 확인 필요.`,
            meta: `Vendor: ${p.vendor_code || '—'} · Value: $${fmt2(p.total_value || 0, 0)}`,
            action: 'polist', actionLabel: 'View PO', created_at: todayStr,
        });
    });

    // 3. Shipment ETAs
    trades.filter(t => t.status === 'in_transit' && t.eta).forEach(t => {
        const eta = new Date(t.eta);
        const days = Math.round((eta - now) / 86400000);
        if (days < 0) {
            newAlerts.push({
                id: (id++).toString(), type: 'shipment', severity: 'critical', read: false,
                title: `Shipment Overdue — ${t.shipment_no}`,
                desc: `ETA ${t.eta}로부터 ${Math.abs(days)}일 경과. 포워더 확인 필요.`,
                meta: `Vendor: ${t.vendor_code || '—'}`,
                action: 'hqtrade', actionLabel: 'View Shipment', created_at: todayStr,
            });
        } else if (days <= 7) {
            newAlerts.push({
                id: (id++).toString(), type: 'shipment', severity: 'info', read: false,
                title: `Shipment Arriving Soon — ${t.shipment_no}`,
                desc: `ETA ${t.eta} (${days}일 후). 입고 준비를 시작하세요.`,
                meta: `Vendor: ${t.vendor_code || '—'} · Qty: ${fmt2(t.qty || 0)} pcs`,
                action: 'hqtrade', actionLabel: 'View', created_at: todayStr,
            });
        }
    });

    // 4. Missing documents on in-transit shipments
    trades.filter(t => ['in_transit', 'customs'].includes(t.status)).forEach(t => {
        const missing = ['invoice', 'bl', 'packing'].filter(d => !['received', 'approved'].includes(t[`doc_${d}_status`]));
        if (missing.length > 0) {
            newAlerts.push({
                id: (id++).toString(), type: 'shipment', severity: 'warning', read: false,
                title: `Missing Documents — ${t.shipment_no}`,
                desc: `미수령 서류: ${missing.join(', ')}`,
                meta: `Vendor: ${t.vendor_code || '—'} · Status: ${t.status}`,
                action: 'hqtrade', actionLabel: 'Update Docs', created_at: todayStr,
            });
        }
    });

    // 5. Low stock (inventory below safety)
    const invByPart = {};
    inventory.forEach(i => { invByPart[i.part_no] = (invByPart[i.part_no] || 0) + (parseInt(i.qty) || 0); });
    parts.forEach(p => {
        const ss = parseInt(p.safety_stock) || 0;
        const qty = invByPart[p.part_no] || 0;
        if (ss > 0 && qty < ss && !MRP_RESULTS.find(r => r.part_no === p.part_no)) {
            newAlerts.push({
                id: (id++).toString(), type: 'inventory', severity: 'warning', read: false,
                title: `Below Safety Stock — ${p.part_no}`,
                desc: `${p.part_name || p.part_no} 현재고 ${fmt2(qty)} < 안전재고 ${fmt2(ss)} pcs`,
                meta: `Vendor: ${p.vendor_code || '—'}`,
                action: 'inventory', actionLabel: 'View Inventory', created_at: todayStr,
            });
        }
    });

    // 6. Vendor KPI at risk
    const byV = {};
    kpis.forEach(k => {
        const v = k.vendor_code; if (!v) return;
        if (!byV[v]) byV[v] = [];
        byV[v].push(parseFloat(k.overall_score) || 0);
    });
    Object.entries(byV).forEach(([vendor, scores]) => {
        const avg = scores.reduce((s, x) => s + x, 0) / scores.length;
        if (avg < 75) {
            newAlerts.push({
                id: (id++).toString(), type: 'kpi', severity: avg < 60 ? 'critical' : 'warning', read: false,
                title: `Vendor at Risk — ${vendor}`,
                desc: `종합 KPI ${Math.round(avg)}점 — 개선 계획 수립 필요.`,
                meta: `${scores.length}건 평가 평균`,
                action: 'kpi', actionLabel: 'View KPI', created_at: todayStr,
            });
        }
    });

    ALERTS = newAlerts;
    await DB.save('alerts', ALERTS);
    renderAlertList();
    updateAlertBadges();
    toast(`${ALERTS.length}개 알림 생성됨`, 'info', 3000);
}

async function refreshAlerts() {
    const saved = await DB.get('alerts');
    ALERTS = saved.length > 0 ? saved : [];
    if (ALERTS.length === 0) await generateAlerts();
    else { renderAlertList(); updateAlertBadges(); }
}

function updateAlertBadges() {
    const counts = { all: ALERTS.length, critical: 0, warning: 0, info: 0 };
    ALERTS.forEach(a => { if (counts[a.severity] != null) counts[a.severity]++; });
    Object.entries(counts).forEach(([k, v]) => {
        const el = document.getElementById(`ab-${k}`);
        if (el) el.textContent = v;
    });
    // Sidebar bell badge
    const dot = document.querySelector('.badge-dot');
    const crit = ALERTS.filter(a => !a.read && a.severity === 'critical').length;
    if (dot) dot.style.display = crit > 0 ? '' : 'none';
    // Dashboard badge
    const dbBadge = document.getElementById('dash-alert-badge');
    if (dbBadge) { dbBadge.textContent = crit; dbBadge.style.display = crit > 0 ? '' : 'none'; }
}

function filterAlerts(filter, btn) {
    ALERT_FILTER = filter;
    document.querySelectorAll('.alert-tab').forEach(t => t.classList.remove('on'));
    if (btn) btn.classList.add('on');
    renderAlertList();
}

function renderAlertList() {
    const listEl = document.getElementById('alert-list');
    if (!listEl) return;
    const unreadOnly = document.getElementById('alert-unread-only')?.checked;
    let filtered = [...ALERTS];
    if (ALERT_FILTER !== 'all') {
        const sevFilters = ['critical', 'warning', 'info'];
        if (sevFilters.includes(ALERT_FILTER)) filtered = filtered.filter(a => a.severity === ALERT_FILTER);
        else filtered = filtered.filter(a => a.type === ALERT_FILTER);
    }
    if (unreadOnly) filtered = filtered.filter(a => !a.read);

    const subEl = document.getElementById('alerts-sub');
    if (subEl) subEl.textContent = `${ALERTS.filter(a => !a.read).length} unread · ${ALERTS.length} total alerts`;

    const dotColor = { critical: 'r', warning: 'a', info: 'c', kpi: 'c', mrp: 'r', po: 'a', shipment: 'a', inventory: 'a' };
    const icon = { mrp: '⚡', po: '📋', shipment: '🚢', inventory: '📦', kpi: '🎯' };
    const fmtAge = ts => { if (!ts) return '—'; const d = new Date(ts), now = new Date(), diff = Math.floor((now - d) / 60000); if (diff < 60) return diff + 'm ago'; if (diff < 1440) return Math.floor(diff / 60) + 'h ago'; return Math.floor(diff / 1440) + 'd ago'; };

    if (!filtered.length) {
        listEl.innerHTML = `<div class="empty" style="padding:48px 0">
                    <div class="empty-icon">✅</div>
                    <div class="empty-text">No alerts for this filter</div>
                </div>`;
        return;
    }
    listEl.innerHTML = filtered.map((a, i) => `
                <div class="alert-card ${!a.read ? 'unread' : ''}" onclick="markRead('${a.id}')">
                    <div class="alert-dot ${dotColor[a.severity] || dotColor[a.type] || 'c'}" ${a.read ? 'style="opacity:.3"' : ''}></div>
                    <div class="alert-icon">${icon[a.type] || '🔔'}</div>
                    <div class="alert-body">
                        <div class="alert-title">${a.title}</div>
                        <div class="alert-desc">${a.desc}</div>
                        <div class="alert-meta">
                            <span class="badge ${a.severity === 'critical' ? 'badge-r' : a.severity === 'warning' ? 'badge-a' : 'badge-c'}" style="font-size:9px">${a.severity}</span>
                            <span>${a.meta || ''}</span>
                            ${a.action ? `<span style="color:var(--cyan);cursor:pointer;text-decoration:underline" onclick="event.stopPropagation();nav('${a.action}')">${a.actionLabel || 'View'} →</span>` : ''}
                        </div>
                    </div>
                    <div class="alert-age">${fmtAge(a.created_at)}</div>
                </div>`).join('');
}

function markRead(id) {
    const a = ALERTS.find(x => x.id === id);
    if (a) { a.read = true; DB.save('alerts', ALERTS); }
    renderAlertList(); updateAlertBadges();
}

function markAllRead() {
    ALERTS.forEach(a => a.read = true);
    DB.save('alerts', ALERTS);
    renderAlertList(); updateAlertBadges();
    toast('모든 알림 읽음 처리', 'info', 2000);
}

// openDP extension for dp-kpi-entry
const _openDPStep7 = openDP;
window.openDP = function (id, mode, data) {
    if (id === 'dp-kpi-entry') {
        closeDP(); activeDP = id;
        document.getElementById('dp-overlay').classList.add('open');
        document.getElementById(id)?.classList.add('open');
        prepKPIPanel(mode, data); return;
    }
    _openDPStep7(id, mode, data);
};

// PAGE_INIT wiring
PAGE_INIT.kpi = renderVendorKPI;
PAGE_INIT.alerts = refreshAlerts;
PAGE_INIT.dashboard = renderDashboard;

// Auto-run dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderDashboard, 400);
});

console.log('%cSCM Pro — STEP 7 loaded: Dashboard Live + Vendor KPI + Alert Center', 'color:#00E5A0;font-weight:bold');
toast('MRP calculation complete', 'success');

let MRP_FILTER = { search: '', status: '', vendor: '' };

function filterMRP() {
    MRP_FILTER.search = document.getElementById('mrp-search')?.value.toLowerCase() || '';
    MRP_FILTER.status = document.getElementById('mrp-filter-status')?.value || '';
    MRP_FILTER.vendor = document.getElementById('mrp-filter-vendor')?.value || '';
    renderMRP();
}

function renderMRP() {
    if (MRP_RESULTS.length === 0) return;

    const today = new Date();
    let data = [...MRP_RESULTS];

    // Apply filters
    const { search, status, vendor } = MRP_FILTER;
    if (search) data = data.filter(r => (r.part_no + r.part_name).toLowerCase().includes(search));
    if (status) data = data.filter(r => r.status === status);
    if (vendor) data = data.filter(r => r.vendor_code === vendor);

    // Sort: impossible > shortage > warning > ok
    const statusOrder = { impossible: 0, shortage: 1, warning: 2, ok: 3 };
    data.sort((a, b) => (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3) || a.part_no.localeCompare(b.part_no));

    // KPI counts (from full MRP_RESULTS, not filtered)
    const counts = { impossible: 0, shortage: 0, warning: 0, ok: 0 };
    MRP_RESULTS.forEach(r => counts[r.status] = (counts[r.status] || 0) + 1);
    document.getElementById('mrp-kpi-impossible').textContent = counts.impossible;
    document.getElementById('mrp-kpi-shortage').textContent = counts.shortage;
    document.getElementById('mrp-kpi-warning').textContent = counts.warning;
    document.getElementById('mrp-kpi-ok').textContent = counts.ok;
    document.getElementById('mrp-sub').textContent = `Calculated: ${today.toLocaleDateString()} · ${MRP_RESULTS.length} parts · ${parseInt(document.getElementById('mrp-horizon')?.value || 16)}-week horizon`;
    document.getElementById('mrp-count').textContent = `${data.length} parts`;

    // Vendor filter options
    const vsel = document.getElementById('mrp-filter-vendor');
    if (vsel) {
        const vendors = [...new Set(MRP_RESULTS.map(r => r.vendor_code).filter(Boolean))].sort();
        const cur = vsel.value;
        vsel.innerHTML = '<option value="">All Vendors</option>' + vendors.map(v => `<option>${v}</option>`).join('');
        vsel.value = cur;
    }

    const statusBadge = s => ({
        impossible: `<span class="badge badge-r">Impossible PO</span>`,
        shortage: `<span class="badge badge-r">Shortage</span>`,
        warning: `<span class="badge badge-a">Warning</span>`,
        ok: `<span class="badge badge-g">OK</span>`
    })[s] || '';

    const orderByCell = r => {
        if (r.status === 'ok' || r.demand === 0) return `<td class="np">OK</td>`;
        const d = r.order_by_date;
        const label = fmtDateShort(d);
        if (r.is_past_order_by) return `<td class="nn fw">${label} !</td>`;
        const daysLeft = Math.round((d - new Date()) / 86400000);
        if (daysLeft <= 30) return `<td class="nw fw">${label}</td>`;
        return `<td class="mono">${label}</td>`;
    };

    const tbody = document.getElementById('mrp-tbody');
    tbody.innerHTML = data.map(r => {
        const rowClass = r.status === 'impossible' ? 'mrp-row-critical' :
            r.status === 'shortage' ? 'mrp-row-critical' :
                r.status === 'warning' ? 'mrp-row-warning' : 'mrp-row-ok';
        const netClass = r.net_position >= 0 ? 'np' : r.status === 'warning' ? 'nw' : 'nn';
        const actionBtn = r.status === 'ok' || r.demand === 0 ? `<button class="btn btn-g btn-sm" disabled>—</button>` :
            `<button class="btn btn-p btn-sm" onclick="preparePO(${JSON.stringify(r).replace(/"/g, '&quot;')})">Issue PO</button>`;

        return `<tr class="${rowClass}" title="Demand from: ${r.from.map(f => `${f.assy}×${f.qty}`).join(', ') || 'No BOM match'}">
      <td class="mono tc">${r.part_no}</td>
      <td class="tx">${r.part_name || '—'}</td>
      <td class="tx mu">${r.vendor_code || '—'}</td>
      <td class="mono ri">${fmt2(r.onhand)}</td>
      <td class="mono ri">${fmt2(r.intransit)}</td>
      <td class="mono ri">${fmt2(r.safety_stock_num) || '—'}</td>
      <td class="mono ri ${r.demand > 0 ? '' : 'mu'}">${r.demand > 0 ? fmt2(r.demand) : '—'}</td>
      <td class="mono ri fw ${netClass}">${r.demand > 0 ? fmt2(r.net_position) : '—'}</td>
      <td class="mono ri">${r.order_qty > 0 ? fmt2(r.order_qty) : '—'}</td>
      <td class="mono mu">${r.leadtime_mp ? r.leadtime_mp + ' days' : '—'}</td>
      ${orderByCell(r)}
      <td>${statusBadge(r.status)}</td>
      <td>${actionBtn}</td>
    </tr>`;
    }).join('') || `<tr><td colspan="13"><div class="empty"><div class="empty-icon">✅</div><div class="empty-text">All ${MRP_RESULTS.length} parts OK for the selected horizon</div></div></td></tr>`;
}

function preparePO(part) {
    // Launch PO Planning page with this part pre-selected
    nav('poplan');
    // Small delay to let page render first
    setTimeout(() => {
        const row = document.querySelector(`#poplan-tbody tr[data-part="${part.part_no}"]`);
        if (row) {
            row.querySelector('input[type="checkbox"]')?.click();
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 300);
}

// ══════════════════════════════════════════════════════
//  STEP 5 — PO PLANNING + PO CRUD + INVENTORY CRUD
// ══════════════════════════════════════════════════════

// ── PO PLANNING PAGE ──────────────────────────────────
let PO_PLAN_SELECTED = new Set(); // selected part_no keys

async function renderPOPlan() {
    if (MRP_RESULTS.length === 0) {
        document.getElementById('poplan-tbody').innerHTML =
            `<tr><td colspan="13"><div class="empty"><div class="empty-icon">⚡</div>
                    <div class="empty-text">먼저 <span style="color:var(--cyan);cursor:pointer" onclick="runMRP()">MRP 계산</span>을 실행하세요</div></div></td></tr>`;
        return;
    }

    const search = document.getElementById('poplan-search')?.value.toLowerCase() || '';
    const statusF = document.getElementById('poplan-filter-status')?.value || '';
    const vendorF = document.getElementById('poplan-filter-vendor')?.value || '';

    // Filter to shortage/impossible/warning only
    let data = MRP_RESULTS.filter(r => ['impossible', 'shortage', 'warning'].includes(r.status));
    if (search) data = data.filter(r => (r.part_no + r.part_name + r.vendor_code).toLowerCase().includes(search));
    if (statusF) data = data.filter(r => r.status === statusF);
    if (vendorF) data = data.filter(r => r.vendor_code === vendorF);

    // Sort: impossible → shortage → warning
    const ord = { impossible: 0, shortage: 1, warning: 2 };
    data.sort((a, b) => (ord[a.status] || 3) - (ord[b.status] || 3));

    // KPI
    const all = MRP_RESULTS;
    document.getElementById('pp-kpi-impossible').textContent = all.filter(r => r.status === 'impossible').length;
    document.getElementById('pp-kpi-shortage').textContent = all.filter(r => r.status === 'shortage').length;
    document.getElementById('pp-kpi-warning').textContent = all.filter(r => r.status === 'warning').length;
    document.getElementById('poplan-count').textContent = `${data.length} items`;
    document.getElementById('poplan-sub').textContent = `${data.length} parts requiring action`;

    // Vendor filter
    const vsel = document.getElementById('poplan-filter-vendor');
    if (vsel) {
        const vendors = [...new Set(MRP_RESULTS.filter(r => r.status !== 'ok').map(r => r.vendor_code).filter(Boolean))].sort();
        const cur = vsel.value;
        vsel.innerHTML = '<option value="">All Vendors</option>' + vendors.map(v => `<option>${v}</option>`).join('');
        vsel.value = cur;
    }

    const statusBadge = s => ({
        impossible: `<span class="badge badge-r">Impossible</span>`,
        shortage: `<span class="badge badge-r">Shortage</span>`,
        warning: `<span class="badge badge-a">Warning</span>`
    })[s] || '';

    const fmtDate = d => {
        if (!d) return '—';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[d.getMonth()] + ' ' + d.getDate();
    };

    document.getElementById('poplan-tbody').innerHTML = data.map(r => {
        const isSelected = PO_PLAN_SELECTED.has(r.part_no);
        const estValue = (r.order_qty || 0) * (r.price || 0);
        const orderByClass = r.is_past_order_by ? 'nn fw' : r.net_position < 0 ? 'nw' : '';
        return `<tr class="po-plan-row${isSelected ? ' selected' : ''}" data-part="${r.part_no}" onclick="togglePOPlanRow('${r.part_no}', event)">
                    <td onclick="event.stopPropagation()">
                        <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="togglePOPlanRow('${r.part_no}', event, this.checked)">
                    </td>
                    <td class="mono tc">${r.part_no}</td>
                    <td class="tx">${r.part_name || '—'}</td>
                    <td class="tx mu">${r.vendor_code || '—'}</td>
                    <td class="mono ri">${fmt2(r.onhand + r.intransit)}</td>
                    <td class="mono ri ${r.demand > 0 ? '' : 'mu'}">${r.demand > 0 ? fmt2(r.demand) : '—'}</td>
                    <td class="mono ri nn fw">${fmt2(r.net_position)}</td>
                    <td class="mono mu">${r.leadtime_mp ? r.leadtime_mp + 'd' : '—'}</td>
                    <td class="${orderByClass}">${r.order_by_date ? fmtDate(r.order_by_date) : '—'}</td>
                    <td class="mono ri mu">${r.order_qty ? fmt2(r.order_qty) : '—'}</td>
                    <td onclick="event.stopPropagation()" style="padding:4px 8px">
                        <input class="qty-edit" type="number" min="0" step="${r.moq || 1}"
                            value="${r.order_qty || 0}" data-part="${r.part_no}"
                            onchange="updatePOPlanQty('${r.part_no}', this.value)"
                            onclick="this.select()">
                    </td>
                    <td class="mono ri">${estValue > 0 ? '$' + fmt2(estValue, 0) : '—'}</td>
                    <td>${statusBadge(r.status)}</td>
                </tr>`;
    }).join('') || `<tr><td colspan="13"><div class="empty">
                <div class="empty-icon">✅</div>
                <div class="empty-text">No shortage items — all parts sufficient</div></div></td></tr>`;

    updatePOPlanKPIs();
}

function togglePOPlanRow(partNo, event, forceState) {
    if (event?.target?.tagName === 'INPUT' && event.target.type === 'number') return;
    const newState = forceState !== undefined ? forceState : !PO_PLAN_SELECTED.has(partNo);
    if (newState) PO_PLAN_SELECTED.add(partNo);
    else PO_PLAN_SELECTED.delete(partNo);

    const row = document.querySelector(`#poplan-tbody tr[data-part="${partNo}"]`);
    if (row) {
        row.classList.toggle('selected', newState);
        const cb = row.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = newState;
    }

    // Sync checkbox in input
    if (event?.target?.type === 'checkbox') event.target.checked = newState;
    updatePOPlanKPIs();
}

function toggleSelectAll(cb) {
    const rows = document.querySelectorAll('#poplan-tbody tr[data-part]');
    rows.forEach(row => {
        const partNo = row.dataset.part;
        if (cb.checked) PO_PLAN_SELECTED.add(partNo);
        else PO_PLAN_SELECTED.delete(partNo);
        row.classList.toggle('selected', cb.checked);
        const rowCb = row.querySelector('input[type="checkbox"]');
        if (rowCb) rowCb.checked = cb.checked;
    });
    updatePOPlanKPIs();
}

function updatePOPlanQty(partNo, val) {
    const r = MRP_RESULTS.find(r => r.part_no === partNo);
    if (r) r.order_qty = parseInt(val) || 0;
    updatePOPlanKPIs();
}

function updatePOPlanKPIs() {
    const selected = MRP_RESULTS.filter(r => PO_PLAN_SELECTED.has(r.part_no));
    const totalValue = selected.reduce((s, r) => s + (r.order_qty || 0) * (r.price || 0), 0);
    const count = selected.length;

    document.getElementById('po-selected-count').textContent = count;
    document.getElementById('pp-kpi-value').textContent = totalValue > 0 ? '$' + fmt2(totalValue, 0) : '—';

    const btn = document.getElementById('issue-selected-btn');
    if (btn) btn.disabled = count === 0;
}

async function issueSelectedPOs() {
    if (PO_PLAN_SELECTED.size === 0) return;

    const selected = MRP_RESULTS.filter(r => PO_PLAN_SELECTED.has(r.part_no));
    if (selected.length === 0) return;

    // Group by vendor
    const byVendor = {};
    selected.forEach(r => {
        const v = r.vendor_code || 'UNKNOWN';
        if (!byVendor[v]) byVendor[v] = [];
        byVendor[v].push(r);
    });

    const ok = await confirm(
        'PO 발행 확인',
        `${Object.keys(byVendor).length}개 업체에 ${selected.length}개 품목을 발주합니다. 각 업체별로 PO가 생성됩니다.`,
        '발행', false
    );
    if (!ok) return;

    const today = new Date().toISOString().slice(0, 10);
    let poCount = 0;

    for (const [vendor, parts] of Object.entries(byVendor)) {
        const poNum = generatePONumber();
        const lines = parts.map(r => ({
            part_no: r.part_no,
            part_name: r.part_name,
            qty: r.order_qty || 0,
            unit_price: r.price || 0,
            currency: r.currency || 'USD',
            amount: (r.order_qty || 0) * (r.price || 0),
            moq: r.moq || 0,
            leadtime_mp: r.leadtime_mp || 0,
        }));

        const totalValue = lines.reduce((s, l) => s + l.amount, 0);
        const avgLT = Math.max(...parts.map(r => r.leadtime_mp || 0));
        const etaDate = new Date();
        etaDate.setDate(etaDate.getDate() + avgLT);

        const po = {
            id: Date.now().toString() + poCount,
            po_number: poNum,
            vendor_code: vendor,
            date: today,
            eta: etaDate.toISOString().slice(0, 10),
            total_value: totalValue,
            currency: 'USD',
            item_count: lines.length,
            progress: 0,
            status: 'issued',
            created_by: 'Admin',
            lines: JSON.stringify(lines),
            remarks: `Auto-generated from MRP shortage analysis`,
        };

        await DB.upsert('polist', po, 'po_number');
        poCount++;
    }

    PO_PLAN_SELECTED.clear();
    toast(`✅ ${poCount}개 PO 발행 완료 → PO List에서 확인`, 'success', 4000);
    renderPOPlan();
    if (PAGE_INIT.polist) PAGE_INIT.polist();
}

function generatePONumber() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 900) + 100);
    return `PO-${y}${m}-${seq}`;
}

// ── PO LIST DETAIL PANEL ──────────────────────────────
// ── VENDOR TRADE TYPE MAP (cached) ────────────────────
let _vendorMap = {};
async function getVendorMap() {
    const vendors = await DB.get('vendors');
    _vendorMap = {};
    vendors.forEach(v => { _vendorMap[v.vendor_code] = v; });
    return vendors;
}

// ── PO TRADE TYPE AUTO-SET ─────────────────────────────
function applyPOTradeType(tradeType) {
    const el = document.getElementById('dpo-trade-type');
    if (el) el.value = tradeType || 'international';
    updatePORequiredDocs(tradeType);
}

function updatePORequiredDocs(tradeType) {
    const isIntl = (tradeType || 'international') === 'international';
    const box = document.getElementById('dpo-req-docs');
    if (!box) return;
    const docs = isIntl
        ? [['invoice', 'Invoice ✓', 'required'], ['bl', 'B/L ✓', 'required'], ['entry', 'Entry Summary ✓', 'required'], ['pod', 'POD ✓', 'required']]
        : [['invoice', 'Invoice ✓', 'required'], ['pod', 'POD ✓', 'required']];
    box.innerHTML = `<div style="font-size:11px;color:var(--t2);margin-bottom:6px">
                ${isIntl ? '🌐 International — 필수 서류:' : '🏠 Domestic — 필수 서류:'}</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">${docs.map(([k, lbl]) => `<span style="font-size:10px;padding:2px 8px;border-radius:4px;border:1px solid var(--cyan);color:var(--cyan)">${lbl}</span>`).join('')
        }</div>`;
}

function onPOVendorChange() {
    const code = document.getElementById('dpo-vendor')?.value;
    const vendor = _vendorMap[code];
    if (!vendor) return;
    // Auto-apply trade type from vendor master
    applyPOTradeType(vendor.trade_type || 'international');
    // Auto-fill currency and incoterms if blank
    const curEl = document.getElementById('dpo-currency');
    if (curEl && !curEl.value) curEl.value = vendor.default_currency || 'USD';
    const incEl = document.getElementById('dpo-incoterms');
    if (incEl && !incEl.value) incEl.value = vendor.incoterms || '';
}

async function prepPOPanel(mode, data) {
    const isNew = mode === 'new';
    document.getElementById('dp-po-title').textContent = isNew ? 'New Purchase Order' : `PO: ${data?.po_number}`;
    document.getElementById('dp-po-sub').textContent = isNew ? 'Draft' : data?.status || 'Draft';
    document.getElementById('dpo-delete-btn').style.display = isNew ? 'none' : '';
    document.getElementById('dpo-issue-btn').style.display = (data?.status === 'draft' || !data) ? '' : 'none';

    // Vendor select (and build map)
    const vendors = await getVendorMap();
    const vsel = document.getElementById('dpo-vendor');
    vsel.innerHTML = '<option value="">— Select Vendor —</option>' +
        vendors.map(v => `<option value="${v.vendor_code}">${v.vendor_code} — ${v.vendor_name}</option>`).join('');
    vsel.onchange = onPOVendorChange;

    // Fill form
    document.getElementById('dpo-id').value = data?.id || '';
    document.getElementById('dpo-number').value = data?.po_number || generatePONumber();
    document.getElementById('dpo-date').value = data?.date || new Date().toISOString().slice(0, 10);
    document.getElementById('dpo-eta').value = data?.eta || '';
    document.getElementById('dpo-currency').value = data?.currency || 'USD';
    document.getElementById('dpo-incoterms').value = data?.incoterms || '';
    document.getElementById('dpo-status').value = data?.status || 'draft';
    document.getElementById('dpo-progress').value = data?.progress || 0;
    document.getElementById('dpo-remarks').value = data?.remarks || '';
    if (data?.vendor_code) {
        document.getElementById('dpo-vendor').value = data.vendor_code;
        // Apply trade type from saved PO or vendor master
        const savedType = data?.trade_type || _vendorMap[data.vendor_code]?.trade_type || 'international';
        applyPOTradeType(savedType);
    } else {
        applyPOTradeType('international');
    }

    // Lines
    let lines = [];
    if (data?.lines) {
        try { lines = typeof data.lines === 'string' ? JSON.parse(data.lines) : data.lines; }
        catch { lines = []; }
    }
    renderPOLines(lines);
    updatePOTotal();
    updatePOTimeline();
}

function renderPOLines(lines = []) {
    const parts_cache = [];
    const tbody = document.getElementById('dpo-lines');
    tbody.innerHTML = lines.map((l, i) => `
                <tr>
                    <td class="mono" style="font-size:11px">${l.part_no || '—'}</td>
                    <td class="tx mu" style="font-size:11px">${l.part_name || '—'}</td>
                    <td style="text-align:right;padding:4px 6px">
                        <input class="qty-edit" style="width:80px" type="number" min="0" value="${l.qty || 0}"
                            onchange="updatePOLine(${i},'qty',this.value)">
                    </td>
                    <td style="text-align:right;padding:4px 6px">
                        <input class="qty-edit" style="width:90px" type="number" min="0" step="0.0001" value="${l.unit_price || 0}"
                            onchange="updatePOLine(${i},'unit_price',this.value)">
                    </td>
                    <td class="mono" style="font-size:11px">${l.currency || 'USD'}</td>
                    <td class="mono ri" id="line-amt-${i}" style="font-size:11px">${fmt2((l.qty || 0) * (l.unit_price || 0), 0)}</td>
                    <td><button class="btn btn-g btn-sm btn-ic" style="color:var(--red)" onclick="removePOLine(${i})">✕</button></td>
                </tr>`).join('') || `<tr><td colspan="7" style="text-align:center;color:var(--t3);font-size:11px;padding:12px">
                    No items — click "+ Add Line" to add parts</td></tr>`;

    // Store lines data
    tbody._lines = lines;
}

function updatePOLine(idx, field, val) {
    const tbody = document.getElementById('dpo-lines');
    if (!tbody._lines) return;
    tbody._lines[idx][field] = field === 'qty' ? parseInt(val) || 0 : parseFloat(val) || 0;
    const amt = (tbody._lines[idx].qty || 0) * (tbody._lines[idx].unit_price || 0);
    const amtEl = document.getElementById(`line-amt-${idx}`);
    if (amtEl) amtEl.textContent = fmt2(amt, 0);
    updatePOTotal();
}

function removePOLine(idx) {
    const tbody = document.getElementById('dpo-lines');
    if (!tbody._lines) return;
    tbody._lines.splice(idx, 1);
    renderPOLines(tbody._lines);
    updatePOTotal();
}

async function addPOLine() {
    const parts = await DB.get('parts');
    const vendor = document.getElementById('dpo-vendor').value;
    const tbody = document.getElementById('dpo-lines');
    if (!tbody._lines) tbody._lines = [];

    // Simple: add blank row
    tbody._lines.push({ part_no: '', part_name: '', qty: 0, unit_price: 0, currency: 'USD', amount: 0 });
    renderPOLines(tbody._lines);
}

function updatePOTotal() {
    const tbody = document.getElementById('dpo-lines');
    const lines = tbody?._lines || [];
    const total = lines.reduce((s, l) => s + (l.qty || 0) * (l.unit_price || 0), 0);
    const totalEl = document.getElementById('dpo-total');
    if (totalEl) totalEl.textContent = total > 0 ? '$' + fmt2(total, 0) : '—';
}

function updatePOTimeline() {
    const status = document.getElementById('dpo-status')?.value || 'draft';
    const steps = ['draft', 'issued', 'partial', 'received'];
    const curIdx = steps.indexOf(status);
    steps.forEach((s, i) => {
        const el = document.getElementById(`dpo-step-${s}`);
        if (!el) return;
        el.classList.remove('done', 'active');
        if (i < curIdx) el.classList.add('done');
        else if (i === curIdx) el.classList.add('active');
    });
}

async function savePO() {
    const tbody = document.getElementById('dpo-lines');
    const lines = tbody?._lines || [];
    const poNum = document.getElementById('dpo-number').value.trim();
    const vendor = document.getElementById('dpo-vendor').value;
    if (!poNum || !vendor) { toast('PO Number와 Vendor는 필수입니다', 'error'); return; }

    const total = lines.reduce((s, l) => s + (l.qty || 0) * (l.unit_price || 0), 0);
    const newStatus = document.getElementById('dpo-status').value;

    // ── Fetch previous status to detect transition ──────
    const prevRec = (await DB.get('polist')).find(p => p.po_number === poNum);
    const prevStatus = prevRec?.status || 'draft';

    const rec = {
        id: document.getElementById('dpo-id').value || Date.now().toString(),
        po_number: poNum,
        vendor_code: vendor,
        trade_type: document.getElementById('dpo-trade-type')?.value || _vendorMap[vendor]?.trade_type || 'international',
        date: document.getElementById('dpo-date').value,
        eta: document.getElementById('dpo-eta').value,
        total_value: total,
        currency: document.getElementById('dpo-currency').value,
        item_count: lines.length,
        progress: parseInt(document.getElementById('dpo-progress').value) || 0,
        status: newStatus,
        created_by: 'Admin',
        lines: JSON.stringify(lines),
        remarks: document.getElementById('dpo-remarks').value.trim(),
    };

    await DB.upsert('polist', rec, 'po_number');

    // ── PO ISSUED → auto-create In-Transit inventory ─────
    if (newStatus === 'issued' && prevStatus !== 'issued' && lines.length > 0) {
        await autoCreateIntransitFromPO(rec, lines);
    }

    // ── PO RECEIVED → move In-Transit → On-Hand ─────────
    if (newStatus === 'received' && prevStatus !== 'received' && lines.length > 0) {
        await autoReceivePOToInventory(rec, lines);
    }

    toast(`PO ${rec.po_number} 저장됨`, 'success');
    closeDP();
    renderPOList();
}

// ── PO Issued → Auto-Create In-Transit Inventory ──────
async function autoCreateIntransitFromPO(po, lines) {
    const today = new Date().toISOString().slice(0, 10);
    let created = 0;
    for (const line of lines) {
        if (!line.part_no || !(parseInt(line.qty) > 0)) continue;
        const inv = await DB.get('inventory');
        // Check if intransit record for this PO+part already exists
        const existing = inv.find(r =>
            r.part_no === line.part_no &&
            r.location === 'intransit' &&
            r.po_number === po.po_number
        );
        if (existing) {
            // Update qty if changed
            if (existing.qty !== parseInt(line.qty)) {
                await DB.upsert('inventory', { ...existing, qty: parseInt(line.qty) }, 'id');
            }
        } else {
            await DB.upsert('inventory', {
                id: `it-${po.po_number}-${line.part_no}`.replace(/[^a-zA-Z0-9-]/g, '_'),
                part_no: line.part_no,
                location: 'intransit',
                qty: parseInt(line.qty) || 0,
                lot_no: '',
                date: today,
                po_number: po.po_number,
                eta: po.eta || '',
                remarks: `Auto In-Transit: ${po.po_number}`,
            }, 'id');
            created++;
        }
    }
    if (created > 0) {
        toast(`🚢 ${created}개 품목 → In-Transit 재고 자동 반영됨 (MRP 즉시 적용)`, 'success', 4000);
        if (document.getElementById('pg-inventory')?.classList.contains('active')) renderInventory();
    }
}

// ── PO → Inventory: move In-Transit → On-Hand ────────
async function autoReceivePOToInventory(po, lines) {
    const today = new Date().toISOString().slice(0, 10);
    let moved = 0;

    for (const line of lines) {
        if (!line.part_no || !(line.qty > 0)) continue;

        // 1) Remove or reduce matching in_transit record
        const inv = await DB.get('inventory');
        const transitIdx = inv.findIndex(r =>
            r.part_no === line.part_no &&
            r.location === 'intransit' &&
            (r.po_number === po.po_number || !r.po_number)
        );
        if (transitIdx >= 0) {
            const t = inv[transitIdx];
            if ((parseInt(t.qty) || 0) <= (parseInt(line.qty) || 0)) {
                await DB.delete('inventory', t.id);
            } else {
                await DB.upsert('inventory', { ...t, qty: t.qty - line.qty }, 'id');
            }
        }

        // 2) Add / merge into on_hand
        const existOnHand = inv.find(r =>
            r.part_no === line.part_no && r.location === 'onhand' && !r.lot_no
        );
        if (existOnHand) {
            await DB.upsert('inventory', {
                ...existOnHand,
                qty: (parseInt(existOnHand.qty) || 0) + (parseInt(line.qty) || 0),
                updated_at: new Date().toISOString(),
            }, 'id');
        } else {
            await DB.upsert('inventory', {
                id: Date.now().toString() + Math.random().toString(36).slice(2),
                part_no: line.part_no,
                location: 'onhand',
                qty: parseInt(line.qty) || 0,
                lot_no: '',
                date: today,
                po_number: po.po_number,
                remarks: `Auto-received from ${po.po_number}`,
            }, 'id');
        }
        moved++;
    }

    if (moved > 0) {
        toast(`✅ ${moved}개 파트 → Inventory (On Hand) 자동 반영됨`, 'success', 4000);
        // Refresh inventory if on screen
        if (document.getElementById('pg-inventory')?.classList.contains('active')) {
            renderInventory();
        }
    }
}

async function issuePO() {
    document.getElementById('dpo-status').value = 'issued';
    updatePOTimeline();
    await savePO();
    // toast shown by autoCreateIntransitFromPO & savePO
}

async function deletePO() {
    const id = document.getElementById('dpo-id').value;
    const po = document.getElementById('dpo-number').value;
    if (!id) return;
    const ok = await confirm('PO 삭제', `${po}를 삭제합니다. 되돌릴 수 없습니다.`, '삭제', true);
    if (!ok) return;
    await DB.delete('polist', id);
    toast('PO 삭제됨', 'warn');
    closeDP();
    renderPOList();
}

// openDP handles dp-po and dp-inventory natively (added in original function)

// ── INVENTORY DETAIL PANEL ────────────────────────────
async function prepInventoryPanel(mode, data) {
    const isNew = mode === 'new';
    document.getElementById('dp-inv-title').textContent = isNew ? 'Adjust Stock' : 'Edit Stock Record';
    document.getElementById('dp-inv-sub').textContent = isNew ? 'Add new inventory record' : `Part: ${data?.part_no}`;
    document.getElementById('dinv-delete-btn').style.display = isNew ? 'none' : '';

    // Parts select
    const parts = await DB.get('parts');
    const psel = document.getElementById('dinv-part');
    psel.innerHTML = '<option value="">— Select Part —</option>' +
        parts.map(p => `<option value="${p.part_no}">${p.part_no} — ${p.part_name}</option>`).join('');

    // Fill form
    document.getElementById('dinv-id').value = data?.id || '';
    document.getElementById('dinv-location').value = data?.location || 'onhand';
    document.getElementById('dinv-qty').value = data?.qty || '';
    document.getElementById('dinv-lot').value = data?.lot_no || '';
    document.getElementById('dinv-date').value = data?.date || new Date().toISOString().slice(0, 10);
    document.getElementById('dinv-po').value = data?.po_number || '';
    document.getElementById('dinv-eta').value = data?.eta || '';
    document.getElementById('dinv-remarks').value = data?.remarks || '';

    if (data?.part_no) {
        psel.value = data.part_no;
        onInvPartChange();
    } else {
        document.getElementById('dinv-partname').value = '';
        document.getElementById('dinv-current-stock').style.display = 'none';
    }
}

async function onInvPartChange() {
    const partNo = document.getElementById('dinv-part')?.value;
    const parts = await DB.get('parts');
    const part = parts.find(p => p.part_no === partNo);
    document.getElementById('dinv-partname').value = part?.part_name || '';

    if (!partNo) {
        document.getElementById('dinv-current-stock').style.display = 'none';
        return;
    }

    // Show current stock for this part
    const inv = await DB.get('inventory');
    const partInv = inv.filter(r => r.part_no === partNo);
    const sumBy = (loc) => partInv.filter(r => r.location === loc).reduce((s, r) => s + (parseInt(r.qty) || 0), 0);

    const onhand = sumBy('onhand');
    const intransit = sumBy('intransit');
    const vmi = sumBy('vmi');

    const stockEl = document.getElementById('dinv-current-stock');
    const tableEl = document.getElementById('dinv-stock-table');
    stockEl.style.display = '';
    tableEl.innerHTML = `
                <div style="display:flex;gap:10px;flex-wrap:wrap">
                    <div class="sc g" style="flex:1;min-width:80px">
                        <div class="sc-label">On Hand</div><div class="sc-val" style="font-size:16px">${fmt2(onhand)}</div>
                    </div>
                    <div class="sc a" style="flex:1;min-width:80px">
                        <div class="sc-label">In Transit</div><div class="sc-val" style="font-size:16px">${fmt2(intransit)}</div>
                    </div>
                    <div class="sc c" style="flex:1;min-width:80px">
                        <div class="sc-label">VMI</div><div class="sc-val" style="font-size:16px">${fmt2(vmi)}</div>
                    </div>
                    <div class="sc c" style="flex:1;min-width:80px;--acc:var(--cyan)">
                        <div class="sc-label">Total</div><div class="sc-val" style="font-size:16px">${fmt2(onhand + intransit + vmi)}</div>
                    </div>
                </div>
                ${partInv.length > 0 ? `
                <div style="margin-top:10px;font-size:11px">
                    <table style="width:100%;border-collapse:collapse">
                        <thead><tr>
                            <th style="padding:4px 8px;border-bottom:1px solid var(--bd);text-align:left;color:var(--t3);font-size:10px;text-transform:uppercase">Location</th>
                            <th style="padding:4px 8px;border-bottom:1px solid var(--bd);text-align:right;color:var(--t3);font-size:10px;text-transform:uppercase">Qty</th>
                            <th style="padding:4px 8px;border-bottom:1px solid var(--bd);text-align:left;color:var(--t3);font-size:10px;text-transform:uppercase">Lot</th>
                            <th style="padding:4px 8px;border-bottom:1px solid var(--bd);text-align:left;color:var(--t3);font-size:10px;text-transform:uppercase">Date</th>
                        </tr></thead>
                        <tbody>${partInv.map(r => `<tr>
                            <td style="padding:5px 8px;border-bottom:1px solid var(--bd)">
                                <span class="badge ${r.location === 'onhand' ? 'loc-onhand' : r.location === 'intransit' ? 'loc-intransit' : 'loc-vmi'}">${r.location}</span>
                            </td>
                            <td style="padding:5px 8px;border-bottom:1px solid var(--bd);text-align:right;font-family:var(--fm)">${fmt2(r.qty)}</td>
                            <td style="padding:5px 8px;border-bottom:1px solid var(--bd);color:var(--t3)">${r.lot_no || '—'}</td>
                            <td style="padding:5px 8px;border-bottom:1px solid var(--bd);color:var(--t3)">${r.date || '—'}</td>
                        </tr>`).join('')}</tbody>
                    </table>
                </div>` : ''}`;
}

async function saveInventory() {
    const partNo = document.getElementById('dinv-part')?.value;
    const qty = document.getElementById('dinv-qty')?.value;
    const location = document.getElementById('dinv-location')?.value;
    if (!partNo || qty === '' || !location) {
        toast('Part, Location, Quantity는 필수입니다', 'error'); return;
    }

    const rec = {
        id: document.getElementById('dinv-id').value || Date.now().toString(),
        part_no: partNo,
        location,
        qty: parseInt(qty) || 0,
        lot_no: document.getElementById('dinv-lot').value.trim(),
        date: document.getElementById('dinv-date').value,
        po_number: document.getElementById('dinv-po').value.trim(),
        eta: document.getElementById('dinv-eta').value,
        remarks: document.getElementById('dinv-remarks').value.trim(),
    };

    await DB.upsert('inventory', rec, 'id');
    toast(`재고 기록 저장됨 — ${partNo} ${fmt2(rec.qty)} pcs (${location})`, 'success');
    closeDP();
    renderInventory();
}

async function deleteInvRecord() {
    const id = document.getElementById('dinv-id').value;
    if (!id) return;
    const ok = await confirm('재고 기록 삭제', '이 재고 기록을 삭제합니다.', '삭제', true);
    if (!ok) return;
    await DB.delete('inventory', id);
    toast('재고 기록 삭제됨', 'warn');
    closeDP();
    renderInventory();
}



console.log('%cSCM Pro — STEP 5 loaded: PO Planning + PO CRUD + Inventory CRUD', 'color:#00D4FF;font-weight:bold');

async function exportMRP() {
    if (MRP_RESULTS.length === 0) { toast('Run MRP first', 'warn'); return; }
    if (!window.XLSX) { await loadXLSX(); }
    const data = MRP_RESULTS.map(r => ({
        part_no: r.part_no, part_name: r.part_name, vendor: r.vendor_code,
        on_hand: r.onhand, in_transit: r.intransit, safety_stock: r.safety_stock_num,
        demand: r.demand, net_position: r.net_position, order_qty: r.order_qty,
        lead_time_days: r.leadtime_mp, order_by: r.order_by_date?.toISOString().slice(0, 10),
        status: r.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MRP_Result');
    XLSX.writeFile(wb, `MRP_Result_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast('MRP exported', 'success');
}

// ── Update dashboard KPIs from live MRP data ──────────
function updateDashboardKPIs() {
    const counts = { impossible: 0, shortage: 0, warning: 0, ok: 0 };
    MRP_RESULTS.forEach(r => counts[r.status] = (counts[r.status] || 0) + 1);
    // Update badge counts in sidebar
    const mrpBadge = document.querySelector('.nav-item[onclick*="mrp"] .nav-badge');
    const total = counts.impossible + counts.shortage + counts.warning;
    if (mrpBadge) mrpBadge.textContent = total;
}

// ══════════════════════════════════════════════════════
//  STEP 8A — SETTINGS (Supabase)
// ══════════════════════════════════════════════════════
function settingsPageInit() {
    updateSBIndicator();
    const saved = localStorage.getItem('scm_sb_key');
    const inp = document.getElementById('sb-key-input');
    if (saved && inp && !inp.value) inp.value = saved;
    const discBtn = document.getElementById('sb-disconnect-btn');
    if (discBtn) discBtn.style.display = SB_READY ? '' : 'none';
    if (SB_READY) {
        const msg = document.getElementById('sb-connect-msg');
        if (msg) { msg.style.display = ''; msg.style.cssText += ';background:rgba(0,229,160,.08);border-color:rgba(0,229,160,.25);color:var(--green)'; msg.textContent = '✅ Supabase 연결됨 — 모든 데이터가 실시간 동기화됩니다'; }
    }
    settingsRefreshStatus();
}

async function settingsConnect() {
    const key = document.getElementById('sb-key-input')?.value.trim();
    if (!key) { toast('Anon Key를 입력하세요', 'warn'); return; }
    const btn = document.getElementById('sb-connect-btn');
    if (btn) { btn.textContent = '⏳ 연결 중...'; btn.disabled = true; }
    const ok = await sbConnect(key);
    if (btn) { btn.textContent = '🔌 Connect'; btn.disabled = false; }
    const msg = document.getElementById('sb-connect-msg');
    const discBtn = document.getElementById('sb-disconnect-btn');
    if (ok) {
        if (msg) { msg.style.display = ''; msg.style.cssText += ';background:rgba(0,229,160,.08);border-color:rgba(0,229,160,.25);color:var(--green)'; msg.textContent = '✅ 연결 성공!'; }
        if (discBtn) discBtn.style.display = '';
        settingsRefreshStatus();
    } else {
        if (msg) { msg.style.display = ''; msg.style.cssText += ';background:rgba(255,69,96,.08);border-color:rgba(255,69,96,.25);color:var(--red)'; msg.textContent = '❌ 연결 실패. Anon Key를 확인하세요.'; }
    }
}

function settingsDisconnect() {
    sbDisconnect();
    const msg = document.getElementById('sb-connect-msg'); if (msg) msg.style.display = 'none';
    const d = document.getElementById('sb-disconnect-btn'); if (d) d.style.display = 'none';
    settingsRefreshStatus();
}

async function settingsMigrate() {
    if (!SB_READY) { toast('먼저 Supabase에 연결하세요', 'warn'); return; }
    const btn = document.getElementById('migrate-btn');
    if (btn) { btn.textContent = '⏳ 마이그레이션 중...'; btn.disabled = true; }
    const results = await DB.migrateAll();
    let html2 = '', total2 = 0;
    for (const [table, res] of Object.entries(results)) {
        if (res.skipped) html2 += `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--bd);font-size:11px"><span>${table}</span><span style="color:var(--t3)">empty</span></div>`;
        else if (res.error) html2 += `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--bd);font-size:11px"><span>${table}</span><span style="color:var(--red)">${res.ok} ⚠ ${res.error.slice(0, 40)}</span></div>`;
        else { total2 += res.ok; html2 += `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--bd);font-size:11px"><span>${table}</span><span style="color:var(--green)">${res.ok} ✓</span></div>`; }
    }
    const el = document.getElementById('migrate-results');
    if (el) { el.style.display = ''; el.innerHTML = html2; }
    toast(`마이그레이션 완료 — ${total2}개 레코드`, 'success', 5000);
    if (btn) { btn.textContent = '🚀 전체 마이그레이션'; btn.disabled = false; }
    settingsRefreshStatus();
}

async function settingsRefreshStatus() {
    const list = document.getElementById('storage-status-list'); if (!list) return;
    list.innerHTML = '<div style="font-size:11px;color:var(--t3)">로딩 중...</div>';
    const rows = [];
    for (const [table, pk] of Object.entries(TABLE_PK)) {
        const local = JSON.parse(localStorage.getItem(`scm_${table}`) || '[]');
        let sbCount = '—';
        if (SB_READY && sbClient) {
            try { const { count } = await sbClient.from(table).select('*', { count: 'exact', head: true }); sbCount = count ?? '—'; } catch { sbCount = 'err'; }
        }
        rows.push(`<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--bd);font-size:11px">
                    <span style="font-family:var(--fm);min-width:110px;color:var(--td)">${table}</span>
                    <span style="color:${local.length > 0 ? 'var(--cyan)' : 'var(--t3)'};min-width:70px">${local.length} local</span>
                    <span style="color:var(--t3)">→</span>
                    <span style="color:${SB_READY ? (typeof sbCount === 'number' && sbCount > 0 ? 'var(--green)' : 'var(--t3)') : 'var(--t3)'}">${SB_READY ? sbCount + ' SB' : '—'}</span>
                </div>`);
    }
    list.innerHTML = rows.join('');
}

async function settingsClearOne() {
    const table = document.getElementById('clear-table-sel')?.value; if (!table) return;
    if (!await confirm(`"${table}" 삭제`, `LocalStorage의 ${table}을 삭제합니다.`, '삭제', true)) return;
    localStorage.removeItem(`scm_${table}`);
    toast(`${table} 로컬 캐시 삭제됨`, 'warn'); settingsRefreshStatus();
}

async function settingsClearAll() {
    if (!await confirm('전체 삭제', '모든 LocalStorage 캐시를 삭제합니다.', '전체 삭제', true)) return;
    Object.keys(TABLE_PK).forEach(t => localStorage.removeItem(`scm_${t}`));
    toast('모든 로컬 캐시 삭제됨', 'error'); settingsRefreshStatus();
}

// ══════════════════════════════════════════════════════
//  STEP 8A — HQ TRADE
// ══════════════════════════════════════════════════════
const DOC_TYPES = ['invoice', 'packing', 'bl', 'co', 'entry', 'pod'];

async function renderHQTrade() {
    const data = await DB.get('hqtrade');
    const search = document.getElementById('hq-search')?.value.toLowerCase() || '';
    const sf = document.getElementById('hq-filter-status')?.value || '';
    const vf = document.getElementById('hq-filter-vendor')?.value || '';
    let filtered = [...data];
    if (search) filtered = filtered.filter(r => (r.shipment_no + r.po_ref + r.vendor_code).toLowerCase().includes(search));
    if (sf) filtered = filtered.filter(r => r.status === sf);
    if (vf) filtered = filtered.filter(r => r.vendor_code === vf);
    filtered.sort((a, b) => (b.etd || '').localeCompare(a.etd || ''));

    const el = id => document.getElementById(id);
    el('hq-kpi-total').textContent = data.length;
    el('hq-kpi-transit').textContent = data.filter(r => r.status === 'in_transit').length;
    el('hq-kpi-customs').textContent = data.filter(r => r.status === 'customs').length;
    el('hq-kpi-delivered').textContent = data.filter(r => ['delivered', 'closed'].includes(r.status)).length;
    const tv = data.reduce((s, r) => s + (parseFloat(r.invoice_amt) || 0), 0);
    el('hq-kpi-value').textContent = '$' + fmt2(tv, 0);
    if (el('hq-sub')) el('hq-sub').textContent = `${data.length} shipments · $${fmt2(tv, 0)} total`;
    el('hq-count').textContent = `${filtered.length} shipments`;

    // Flow strip counts
    ['invoice', 'packing', 'bl', 'co', 'entry', 'pod'].forEach(doc => {
        const cnt = data.filter(r => ['received', 'approved', 'filed'].includes(r[`doc_${doc}_status`])).length;
        const cEl = el(`hq-cnt-${doc}`); if (cEl) cEl.textContent = cnt;
        const sEl = el(`hq-stage-${doc}`);
        if (sEl) { sEl.classList.remove('has-data', 'complete'); if (cnt === data.length && data.length > 0) sEl.classList.add('complete'); else if (cnt > 0) sEl.classList.add('has-data'); }
    });

    // Vendor filter
    const vsel = el('hq-filter-vendor');
    if (vsel) { const vcs = [...new Set(data.map(r => r.vendor_code).filter(Boolean))].sort(); const cur = vsel.value; vsel.innerHTML = '<option value="">All Vendors</option>' + vcs.map(v => `<option>${v}</option>`).join(''); vsel.value = cur; }

    const sb = s => ({ open: `<span class="badge badge-m">Open</span>`, in_transit: `<span class="badge badge-c">In Transit</span>`, customs: `<span class="badge badge-a">At Customs</span>`, delivered: `<span class="badge badge-g">Delivered</span>`, closed: `<span class="badge badge-g" style="opacity:.6">Closed</span>` })[s] || `<span class="badge badge-m">${s || '—'}</span>`;
    const dp = r => DOC_TYPES.map(d => { const st = r[`doc_${d}_status`] || 'pending'; const cls = ['received', 'approved', 'filed'].includes(st) ? 'done' : st === 'issues' ? 'partial' : 'missing'; return `<div class="doc-pill ${cls}" title="${d}: ${st}"></div>`; }).join('');

    el('hq-tbody').innerHTML = filtered.map(r => {
        const esc = JSON.stringify(r).replace(/"/g, '&quot;');
        return `<tr onclick="openDP('dp-trade','edit',${esc})" style="cursor:pointer">
                    <td class="mono tc" style="color:var(--cyan)">${r.shipment_no || '—'}</td>
                    <td class="mono mu">${r.po_ref || '—'}</td>
                    <td class="tx fw">${r.vendor_code || '—'}</td>
                    <td class="mono">${r.etd || '—'}</td>
                    <td class="mono">${r.eta || '—'}</td>
                    <td class="mono ri">${r.invoice_amt ? '$' + fmt2(r.invoice_amt, 0) : '—'}</td>
                    <td class="mono mu">${r.currency || 'USD'}</td>
                    <td><div class="doc-pills">${dp(r)}</div></td>
                    <td>${sb(r.status)}</td>
                    <td><button class="btn btn-g btn-sm btn-ic" onclick="event.stopPropagation();openDP('dp-trade','edit',${esc})">✏️</button></td>
                </tr>`;
    }).join('') || `<tr><td colspan="10"><div class="empty"><div class="empty-icon">🚢</div><div class="empty-text">No shipments — <span style="color:var(--cyan);cursor:pointer" onclick="openDP('dp-trade','new')">create one</span></div></div></td></tr>`;
}

async function prepTradePanel(mode, data) {
    const isNew = mode === 'new';
    document.getElementById('dp-trade-title').textContent = isNew ? 'New Shipment' : `Shipment: ${data?.shipment_no}`;
    document.getElementById('dp-trade-sub').textContent = isNew ? 'Import document tracking' : `Status: ${data?.status || 'open'}`;
    document.getElementById('dtrade-delete-btn').style.display = isNew ? 'none' : '';
    const vendors = await DB.get('vendors');
    const vsel = document.getElementById('dtrade-vendor');
    vsel.innerHTML = '<option value="">— Select Vendor —</option>' + vendors.map(v => `<option value="${v.vendor_code}">${v.vendor_code} — ${v.vendor_name}</option>`).join('');
    const pos = await DB.get('polist');
    const psel = document.getElementById('dtrade-po');
    psel.innerHTML = '<option value="">— Link to PO —</option>' + pos.map(p => `<option value="${p.po_number}">${p.po_number} / ${p.vendor_code}</option>`).join('');
    const set = (id, val) => { const e = document.getElementById(id); if (e) e.value = val ?? ''; };
    set('dtrade-id', data?.id || ''); set('dtrade-no', data?.shipment_no || genShipNo());
    set('dtrade-etd', data?.etd || ''); set('dtrade-eta', data?.eta || '');
    set('dtrade-invoice-amt', data?.invoice_amt || ''); set('dtrade-currency', data?.currency || 'USD');
    set('dtrade-qty', data?.qty || ''); set('dtrade-status', data?.status || 'open');
    set('dtrade-incoterms', data?.incoterms || 'FOB'); set('dtrade-origin', data?.origin || '');
    set('dtrade-dest', data?.dest || ''); set('dtrade-remarks', data?.remarks || '');
    if (data?.vendor_code) vsel.value = data.vendor_code;
    if (data?.po_ref) psel.value = data.po_ref;
    DOC_TYPES.forEach(doc => {
        set(`doc-${doc}-status`, data?.[`doc_${doc}_status`] || 'pending');
        set(`doc-${doc}-no`, data?.[`doc_${doc}_no`] || '');
        set(`doc-${doc}-date`, data?.[`doc_${doc}_date`] || '');
        updateDocStyle(doc);
    });
}

function updateDocStyle(doc) {
    const sel = document.getElementById(`doc-${doc}-status`);
    const row = document.getElementById(`doc-${doc}`);
    if (!sel || !row) return;
    const st = sel.value;
    row.classList.remove('received', 'issues');
    if (['received', 'approved', 'filed'].includes(st)) row.classList.add('received');
    else if (st === 'issues') row.classList.add('issues');
}

async function saveTrade() {
    const no = document.getElementById('dtrade-no')?.value.trim();
    const vendor = document.getElementById('dtrade-vendor')?.value;
    if (!no || !vendor) { toast('Shipment No와 Vendor는 필수입니다', 'error'); return; }

    const podNo = document.getElementById('doc-pod-no')?.value.trim();
    const podDate = document.getElementById('doc-pod-date')?.value;
    const podStatus = document.getElementById('doc-pod-status')?.value;

    // ── POD 입력 시 자동 complete 전환 ────────────────────
    let statusVal = document.getElementById('dtrade-status').value;
    const prevRec = (await DB.get('hqtrade')).find(t => t.shipment_no === no);
    const prevPodNo = prevRec?.doc_pod_no || '';
    // If POD number is newly entered → auto-complete
    if (podNo && !prevPodNo && statusVal !== 'complete') {
        statusVal = 'complete';
        if (document.getElementById('dtrade-status')) {
            document.getElementById('dtrade-status').value = 'complete';
        }
        toast('📦 POD 입력 확인 — Shipment Complete 처리됨', 'success', 4000);
    }

    const rec = {
        id: document.getElementById('dtrade-id').value || Date.now().toString(),
        shipment_no: no, vendor_code: vendor,
        po_ref: document.getElementById('dtrade-po').value,
        etd: document.getElementById('dtrade-etd').value,
        eta: document.getElementById('dtrade-eta').value,
        invoice_amt: parseFloat(document.getElementById('dtrade-invoice-amt').value) || 0,
        currency: document.getElementById('dtrade-currency').value,
        qty: parseInt(document.getElementById('dtrade-qty').value) || 0,
        status: statusVal,
        incoterms: document.getElementById('dtrade-incoterms').value,
        origin: document.getElementById('dtrade-origin').value,
        dest: document.getElementById('dtrade-dest').value,
        remarks: document.getElementById('dtrade-remarks').value.trim(),
    };
    DOC_TYPES.forEach(doc => {
        rec[`doc_${doc}_status`] = document.getElementById(`doc-${doc}-status`)?.value || 'pending';
        rec[`doc_${doc}_no`] = document.getElementById(`doc-${doc}-no`)?.value.trim() || '';
        rec[`doc_${doc}_date`] = document.getElementById(`doc-${doc}-date`)?.value || '';
    });
    await DB.upsert('hqtrade', rec, 'shipment_no');

    // ── POD 완료 시 In-Transit → On-Hand 전환 ────────────
    if (podNo && !prevPodNo && rec.po_ref) {
        const polist = await DB.get('polist');
        const po = polist.find(p => p.po_number === rec.po_ref);
        if (po && po.lines) {
            try {
                const lines = typeof po.lines === 'string' ? JSON.parse(po.lines) : po.lines;
                await autoReceivePOToInventory(po, lines);
                // Also mark PO as received
                await DB.upsert('polist', { ...po, status: 'received', progress: 100 }, 'po_number');
            } catch (e) { console.warn('POD 재고 전환 오류:', e); }
        }
    }

    toast(`Shipment ${rec.shipment_no} 저장됨`, 'success');
    closeDP(); renderHQTrade();
}

async function deleteTrade() {
    const id = document.getElementById('dtrade-id').value;
    const no = document.getElementById('dtrade-no').value;
    if (!id) return;
    if (!await confirm('Shipment 삭제', `${no}를 삭제합니다.`, '삭제', true)) return;
    await DB.delete('hqtrade', id);
    toast('Shipment 삭제됨', 'warn'); closeDP(); renderHQTrade();
}

function openLCFromTrade() {
    const no = document.getElementById('dtrade-no')?.value;
    const vd = document.getElementById('dtrade-vendor')?.value;
    const inv = document.getElementById('dtrade-invoice-amt')?.value;
    closeDP(); nav('landedcost');
    setTimeout(() => {
        const s = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
        if (no) s('lc-shipment-no', no); if (vd) s('lc-vendor', vd); if (inv) s('lc-invoice-amt', inv);
        calcLandedCost();
    }, 200);
}

function genShipNo() {
    const d = new Date();
    return `SHP-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;
}

// ══════════════════════════════════════════════════════
//  STEP 8A — LANDED COST
// ══════════════════════════════════════════════════════
const LC_COLORS = ['#00D4FF', '#00E5A0', '#FFB020', '#FF4560', '#8888FF', '#FF8080'];

function calcLandedCost() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    const fx = v('lc-fx-rate') || 1380;
    const invUSD = v('lc-invoice-amt'), ocean = v('lc-ocean'), air = v('lc-air');
    const inOri = v('lc-inland-origin'), ins = v('lc-insurance'), fwd = v('lc-forwarding');
    const inDest = v('lc-inland-dest'), broker = v('lc-brokerage'), other = v('lc-other');
    const freightUSD = ocean + air + inOri + ins + fwd, cifUSD = invUSD + freightUSD;
    const el = id => document.getElementById(id);
    if (el('lc-cif-display')) el('lc-cif-display').textContent = '$' + fmt2(cifUSD, 0);
    const cifKRW = cifUSD * fx, dr = v('lc-duty-rate') / 100, vr = v('lc-vat-rate') / 100;
    const dutyKRW = cifKRW * dr, vatKRW = (cifKRW + dutyKRW) * vr;
    if (el('lc-duty-display')) el('lc-duty-display').textContent = '₩' + fmt2(dutyKRW, 0);
    if (el('lc-vat-display')) el('lc-vat-display').textContent = '₩' + fmt2(vatKRW, 0);
    const purchKRW = invUSD * fx, freightKRW = freightUSD * fx + inDest;
    const custKRW = dutyKRW + vatKRW + broker, grand = purchKRW + freightKRW + custKRW + other;
    const grandUSD = grand / fx;
    if (el('lc-grand-total-krw')) el('lc-grand-total-krw').textContent = '₩ ' + fmt2(grand, 0);
    if (el('lc-grand-total-usd')) el('lc-grand-total-usd').textContent = '≈ $' + fmt2(grandUSD, 0);
    const qty = v('lc-total-qty'), wt = v('lc-weight');
    if (el('lc-unit-cost')) el('lc-unit-cost').textContent = qty > 0 ? '₩' + fmt2(grand / qty, 0) : '—';
    if (el('lc-cost-kg')) el('lc-cost-kg').textContent = wt > 0 ? '₩' + fmt2(grand / wt, 0) : '—';
    if (el('lc-markup')) el('lc-markup').textContent = invUSD > 0 ? '+' + fmt2((grandUSD - invUSD) / invUSD * 100, 1) + '%' : '—';
    const secs = [{ label: 'Purchase', krw: purchKRW, color: LC_COLORS[0] }, { label: 'Freight', krw: freightKRW, color: LC_COLORS[1] }, { label: 'Duty', krw: dutyKRW, color: LC_COLORS[2] }, { label: 'VAT', krw: vatKRW, color: LC_COLORS[3] }, { label: 'Brokerage', krw: broker, color: LC_COLORS[4] }, { label: 'Other', krw: other, color: LC_COLORS[5] }].filter(s => s.krw > 0);
    const bk = el('lc-breakdown-rows');
    if (bk && grand > 0) bk.innerHTML = secs.map(s => { const p = (s.krw / grand * 100).toFixed(1); return `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid var(--bd)"><div style="width:9px;height:9px;border-radius:2px;background:${s.color};flex-shrink:0"></div><div style="flex:1;font-size:11px;color:var(--t2)">${s.label}</div><div style="font-family:var(--fm);font-size:11px">₩${fmt2(s.krw, 0)}</div><div style="font-size:10px;color:var(--t3);min-width:34px;text-align:right">${p}%</div></div>`; }).join('');
    const bar = el('lc-bar-stack');
    if (bar && grand > 0) bar.innerHTML = secs.map(s => `<div style="width:${(s.krw / grand * 100).toFixed(2)}%;background:${s.color}" title="${s.label}:₩${fmt2(s.krw, 0)}"></div>`).join('');
}

async function loadLCShipment() {
    const no = document.getElementById('lc-filter-shipment')?.value; if (!no) return;
    const t = (await DB.get('hqtrade')).find(t => t.shipment_no === no); if (!t) return;
    const s = (id, v) => { const e = document.getElementById(id); if (e) e.value = v ?? ''; };
    s('lc-shipment-no', t.shipment_no); s('lc-vendor', t.vendor_code);
    s('lc-invoice-no', t.doc_invoice_no || ''); s('lc-invoice-date', t.doc_invoice_date || '');
    s('lc-invoice-amt', t.invoice_amt || 0);
    calcLandedCost(); toast(`Loaded: ${no}`, 'info', 2000);
}

async function saveLandedCost() {
    const v = id => document.getElementById(id)?.value;
    const g = parseFloat((document.getElementById('lc-grand-total-krw')?.textContent || '').replace(/[^\d.-]/g, '')) || 0;
    if (!g) { toast('먼저 계산해주세요', 'warn'); return; }
    await DB.upsert('landedcost', { id: Date.now().toString(), shipment_no: v('lc-shipment-no') || 'LC-' + Date.now().toString(36), vendor: v('lc-vendor') || '', invoice_no: v('lc-invoice-no') || '', invoice_amt: parseFloat(v('lc-invoice-amt')) || 0, fx_rate: parseFloat(v('lc-fx-rate')) || 1380, ocean: parseFloat(v('lc-ocean')) || 0, air: parseFloat(v('lc-air')) || 0, inland_ori: parseFloat(v('lc-inland-origin')) || 0, inland_dest: parseFloat(v('lc-inland-dest')) || 0, insurance: parseFloat(v('lc-insurance')) || 0, forwarding: parseFloat(v('lc-forwarding')) || 0, duty_rate: parseFloat(v('lc-duty-rate')) || 0, vat_rate: parseFloat(v('lc-vat-rate')) || 10, brokerage: parseFloat(v('lc-brokerage')) || 0, other: parseFloat(v('lc-other')) || 0, total_qty: parseInt(v('lc-total-qty')) || 0, weight: parseFloat(v('lc-weight')) || 0, grand_total_krw: g, calc_date: new Date().toISOString().slice(0, 10) }, 'id');
    toast('Landed Cost 저장됨', 'success'); renderLCHistory();
}

async function renderLCHistory() {
    const data = await DB.get('landedcost');
    const trades = await DB.get('hqtrade');
    const fsel = document.getElementById('lc-filter-shipment');
    if (fsel) { const cur = fsel.value; fsel.innerHTML = '<option value="">— Load from Shipment —</option>' + trades.map(t => `<option value="${t.shipment_no}">${t.shipment_no} / ${t.vendor_code}</option>`).join(''); fsel.value = cur; }
    const listEl = document.getElementById('lc-history-list'); if (!listEl) return;
    if (!data.length) { listEl.innerHTML = '<div style="font-size:11px;color:var(--t3);padding:8px 0">No saved calculations</div>'; return; }
    listEl.innerHTML = [...data].reverse().slice(0, 8).map(r => `<div style="border:1px solid var(--bd);border-radius:var(--r);padding:8px 12px;cursor:pointer;transition:border-color var(--tr);margin-bottom:6px" onclick="loadSavedLC('${r.id}')" onmouseenter="this.style.borderColor='var(--cyan)'" onmouseleave="this.style.borderColor='var(--bd)'"><div style="display:flex;justify-content:space-between"><span style="font-family:var(--fm);font-size:12px;color:var(--cyan)">${r.shipment_no}</span><span style="font-family:var(--fm);font-size:12px;font-weight:700">₩${fmt2(r.grand_total_krw, 0)}</span></div><div style="display:flex;justify-content:space-between;margin-top:2px"><span style="font-size:10px;color:var(--t3)">${r.vendor || '—'} · ${r.calc_date || '—'}</span><span style="font-size:10px;color:var(--t3)">${r.total_qty ? fmt2(r.total_qty) + ' pcs' : ''}</span></div></div>`).join('');
}

async function loadSavedLC(id) {
    const r = (await DB.get('landedcost')).find(d => d.id === id); if (!r) return;
    const s = (id, v) => { const e = document.getElementById(id); if (e) e.value = v ?? ''; };
    s('lc-shipment-no', r.shipment_no); s('lc-vendor', r.vendor); s('lc-invoice-no', r.invoice_no);
    s('lc-invoice-amt', r.invoice_amt); s('lc-fx-rate', r.fx_rate); s('lc-ocean', r.ocean);
    s('lc-air', r.air); s('lc-inland-origin', r.inland_ori); s('lc-inland-dest', r.inland_dest);
    s('lc-insurance', r.insurance); s('lc-forwarding', r.forwarding); s('lc-duty-rate', r.duty_rate);
    s('lc-vat-rate', r.vat_rate); s('lc-brokerage', r.brokerage); s('lc-other', r.other);
    s('lc-total-qty', r.total_qty); s('lc-weight', r.weight);
    calcLandedCost(); toast(`Loaded: ${r.shipment_no}`, 'info', 2000);
}

async function exportLandedCost() {
    const v = id => document.getElementById(id)?.value;
    const r = { shipment_no: v('lc-shipment-no'), vendor: v('lc-vendor'), invoice_amt: v('lc-invoice-amt'), fx_rate: v('lc-fx-rate'), ocean: v('lc-ocean'), air: v('lc-air'), inland_origin: v('lc-inland-origin'), inland_dest: v('lc-inland-dest'), insurance: v('lc-insurance'), forwarding: v('lc-forwarding'), duty_rate: v('lc-duty-rate'), vat_rate: v('lc-vat-rate'), brokerage: v('lc-brokerage'), other: v('lc-other'), total_qty: v('lc-total-qty'), weight: v('lc-weight'), grand_total_krw: document.getElementById('lc-grand-total-krw')?.textContent, unit_cost: document.getElementById('lc-unit-cost')?.textContent };
    if (!window.XLSX) await loadXLSX();
    const ws = XLSX.utils.json_to_sheet([r]); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Landed_Cost');
    XLSX.writeFile(wb, `Landed_Cost_${r.shipment_no || 'calc'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast('Exported', 'success');
}

// ══════════════════════════════════════════════════════
//  STEP 8B — EXPORT (Dashboard, PO Plan) + openDP ext
// ══════════════════════════════════════════════════════
async function exportDashboard() {
    if (!window.XLSX) { await loadXLSX(); }
    const [pos, trades, inv] = await Promise.all([DB.get('polist'), DB.get('hqtrade'), DB.get('inventory')]);
    const wb = XLSX.utils.book_new();
    if (MRP_RESULTS.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(MRP_RESULTS.map(r => ({ part_no: r.part_no, part_name: r.part_name, vendor: r.vendor_code, net_position: r.net_position, order_qty: r.order_qty, status: r.status }))), 'MRP_Shortage');
    if (pos.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pos.map(p => ({ po_number: p.po_number, vendor: p.vendor_code, date: p.date, value: p.total_value, status: p.status }))), 'Open_POs');
    if (trades.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trades.map(t => ({ shipment: t.shipment_no, vendor: t.vendor_code, eta: t.eta, status: t.status }))), 'In_Transit');
    XLSX.writeFile(wb, `Dashboard_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast('Dashboard report exported', 'success');
}

// Wire Dashboard export button
document.addEventListener('DOMContentLoaded', () => {
    const dashExport = document.querySelector('#pg-dashboard .ph-acts button');
    if (dashExport && dashExport.textContent.includes('Export')) {
        dashExport.setAttribute('onclick', 'exportDashboard()');
    }
    // Wire PO Plan export
    const poPlanExport = document.querySelector('#pg-poplan .ph-acts button[onclick*="export"], #pg-poplan .ph-acts button:not([onclick*="nav"]):not([onclick*="issue"])');
    if (poPlanExport) poPlanExport.setAttribute('onclick', "exportTable('polist')");
});

// openDP extension for dp-trade and dp-so
const _origOpenDP = openDP;
window.openDP = async function (id, mode, data) {
    if (id === 'dp-trade') {
        closeDP(); activeDP = id;
        document.getElementById('dp-overlay')?.classList.add('open');
        document.getElementById(id)?.classList.add('open');
        prepTradePanel(mode, data); return;
    }
    if (id === 'dp-so') {
        document.getElementById('dp-overlay')?.classList.add('open');
        document.getElementById('dp-so')?.classList.add('open');
        await prepSOPanel(mode, data ? (typeof data === 'string' ? JSON.parse(data) : data) : null);
        return;
    }
    _origOpenDP(id, mode, data);
};

// PAGE_INIT wiring
PAGE_INIT.settings = settingsPageInit;
PAGE_INIT.hqtrade = renderHQTrade;
PAGE_INIT.landedcost = () => { calcLandedCost(); renderLCHistory(); };

// ══════════════════════════════════════════════════════
//  STEP 8C — MOBILE + PWA
// ══════════════════════════════════════════════════════

function toggleSidebar() {
    const sidebar = document.querySelector('.app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const toggle = document.getElementById('nav-toggle');
    const isOpen = sidebar.classList.contains('open');
    sidebar.classList.toggle('open', !isOpen);
    backdrop.classList.toggle('open', !isOpen);
    toggle.classList.toggle('open', !isOpen);
}

function closeSidebar() {
    document.querySelector('.app-sidebar')?.classList.remove('open');
    document.getElementById('sidebar-backdrop')?.classList.remove('open');
    document.getElementById('nav-toggle')?.classList.remove('open');
}

function navMobile(page) {
    nav(page);
    closeSidebar();
    document.querySelectorAll('.mbn-item').forEach(el =>
        el.classList.toggle('active', el.dataset.page === page));
}

// Close sidebar on nav-item click (mobile)
document.querySelectorAll('.nav-item').forEach(item =>
    item.addEventListener('click', () => { if (window.innerWidth <= 768) closeSidebar(); })
);

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });

// Swipe gesture: edge-right to open, left to close
(function () {
    let startX = 0, startY = 0, tracking = false;
    const THRESHOLD = 60, EDGE = 30;
    document.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        const isOpen = document.querySelector('.app-sidebar')?.classList.contains('open');
        tracking = startX < EDGE || isOpen;
    }, { passive: true });
    document.addEventListener('touchend', e => {
        if (!tracking) return;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = Math.abs(e.changedTouches[0].clientY - startY);
        if (dy > 70) { tracking = false; return; }
        const isOpen = document.querySelector('.app-sidebar')?.classList.contains('open');
        if (dx > THRESHOLD && !isOpen) toggleSidebar();
        if (dx < -THRESHOLD && isOpen) closeSidebar();
        tracking = false;
    }, { passive: true });
})();

// PWA
let deferredPrompt = null;
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => {
                console.log('%c[PWA] SW registered ✓', 'color:#00E5A0');
                reg.addEventListener('updatefound', () => {
                    const sw = reg.installing;
                    sw?.addEventListener('statechange', () => {
                        if (sw.state === 'installed' && navigator.serviceWorker.controller)
                            setTimeout(() => toast('🔄 새 버전 사용 가능 — 새로고침', 'info', 8000), 2000);
                    });
                });
            })
            .catch(e => console.warn('[PWA] SW failed:', e));
    });
}
window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    if (!localStorage.getItem('pwa_dismissed'))
        setTimeout(() => document.getElementById('pwa-banner')?.classList.add('show'), 3000);
});
window.addEventListener('appinstalled', () => {
    document.getElementById('pwa-banner')?.classList.remove('show');
    deferredPrompt = null;
    toast('✅ SCM Pro 설치 완료!', 'success', 4000);
});

function pwaInstall() {
    if (!deferredPrompt) { toast('Safari → 공유 → 홈 화면에 추가', 'info', 6000); return; }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(c => {
        deferredPrompt = null;
        document.getElementById('pwa-banner')?.classList.remove('show');
    });
}
function pwaDismiss() {
    document.getElementById('pwa-banner')?.classList.remove('show');
    localStorage.setItem('pwa_dismissed', '1');
}

console.log('%cSCM Pro — STEP 8C: Mobile Responsive + PWA ✓', 'color:#00E5A0;font-weight:bold');

// ════════════════════════════════════════════════════
// PHASE 2: SALES ORDERS
// ════════════════════════════════════════════════════

function generateSONumber() {
    const y = new Date().getFullYear();
    const n = Math.floor(Math.random() * 900) + 100;
    return `SO-${y}-${n}`;
}

function generateINVNumber() {
    const y = new Date().getFullYear();
    const n = String(Date.now()).slice(-4);
    return `INV-${y}-${n}`;
}

async function renderSalesOrders() {
    const all = await DB.get('salesorders');
    const q = document.getElementById('so-search')?.value.toLowerCase() || '';
    const stF = document.getElementById('so-filter-status')?.value || '';
    const custF = document.getElementById('so-filter-customer')?.value || '';

    // Populate customer filter
    const custs = [...new Set(all.map(s => s.customer).filter(Boolean))].sort();
    const custEl = document.getElementById('so-filter-customer');
    if (custEl) {
        const prev = custEl.value;
        custEl.innerHTML = '<option value="">All Customers</option>' +
            custs.map(c => `<option value="${c}">${c}</option>`).join('');
        custEl.value = prev;
    }

    let rows = all.filter(s => {
        if (stF && s.status !== stF) return false;
        if (custF && s.customer !== custF) return false;
        if (q && !(`${s.so_number}${s.customer_po}${s.customer}${s.part_no}`).toLowerCase().includes(q)) return false;
        return true;
    });

    const ST_BADGE = { open: 'a', shipped: 'g', invoiced: 'c', closed: '' };
    const tbody = document.getElementById('so-tbody');
    if (!tbody) return;
    tbody.innerHTML = rows.length ? rows.map(s => {
        const val = (parseFloat(s.unit_price) || 0) * (parseInt(s.qty) || 0);
        return `<tr>
                    <td><input type="checkbox" class="so-check" data-id="${s.id}"></td>
                    <td><b>${s.so_number}</b></td>
                    <td>${s.customer_po || '—'}</td>
                    <td>${s.customer || '—'}</td>
                    <td>${s.part_no || '—'}</td>
                    <td style="text-align:right">${(s.qty || 0).toLocaleString()}</td>
                    <td style="text-align:right">${(s.shipped_qty || 0).toLocaleString()}</td>
                    <td style="text-align:right">${(s.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>${s.due_date || '—'}</td>
                    <td><span class="badge ${ST_BADGE[s.status] || ''}">${s.status}</span></td>
                    <td style="display:flex;gap:4px;flex-wrap:wrap">
                        <button class="btn btn-g btn-sm" onclick="openDP('dp-so','edit',${JSON.stringify(s).replace(/"/g, '&quot;')})">Edit</button>
                        ${s.status === 'open' ? `<button class="btn btn-s btn-sm" style="font-size:11px" onclick="openShipDialog('${s.id}')">🚚 Ship</button>` : ''}
                    </td>
                </tr>`;
    }).join('') : '<tr><td colspan="11" style="text-align:center;padding:24px;color:var(--t3)">No sales orders</td></tr>';

    // KPI
    const totalVal = all.reduce((s, r) => s + (parseFloat(r.unit_price) || 0) * (parseInt(r.qty) || 0), 0);
    document.getElementById('so-kpi-total').textContent = all.length;
    document.getElementById('so-kpi-open').textContent = all.filter(r => r.status === 'open').length;
    document.getElementById('so-kpi-shipped').textContent = all.filter(r => r.status === 'shipped').length;
    document.getElementById('so-kpi-value').textContent = '$' + totalVal.toLocaleString(undefined, { minimumFractionDigits: 0 });
    document.getElementById('so-count').textContent = `${rows.length} orders`;
}

function toggleAllSO(cb) {
    document.querySelectorAll('.so-check').forEach(c => c.checked = cb.checked);
}

async function prepSOPanel(mode, data) {
    const isNew = mode === 'new';
    document.getElementById('dp-so-title').textContent = isNew ? 'New Sales Order' : `SO: ${data?.so_number}`;
    document.getElementById('dp-so-sub').textContent = data?.status || 'open';
    document.getElementById('so-delete-btn').style.display = isNew ? 'none' : '';

    // Populate customers from products
    const products = await DB.get('products');
    const custs = [...new Set(products.map(p => p.customer).filter(Boolean))].sort();
    document.getElementById('dso-customer').innerHTML = '<option value="">— Select Customer —</option>' +
        custs.map(c => `<option value="${c}">${c}</option>`).join('');

    // Populate parts
    document.getElementById('dso-part').innerHTML = '<option value="">— Select Part —</option>' +
        products.map(p => `<option value="${p.part_no}">${p.part_no} — ${p.part_name || ''}</option>`).join('');

    document.getElementById('dso-id').value = data?.id || '';
    document.getElementById('dso-number').value = data?.so_number || generateSONumber();
    document.getElementById('dso-cust-po').value = data?.customer_po || '';
    document.getElementById('dso-customer').value = data?.customer || '';
    document.getElementById('dso-part').value = data?.part_no || '';
    document.getElementById('dso-qty').value = data?.qty || '';
    document.getElementById('dso-shipped-qty').value = data?.shipped_qty || 0;
    document.getElementById('dso-price').value = data?.unit_price || '';
    document.getElementById('dso-currency').value = data?.currency || 'USD';
    document.getElementById('dso-due').value = data?.due_date || '';
    document.getElementById('dso-status').value = data?.status || 'open';
    document.getElementById('dso-remarks').value = data?.remarks || '';
}

async function saveSO() {
    const soNum = document.getElementById('dso-number').value.trim();
    const cust = document.getElementById('dso-customer').value;
    const partNo = document.getElementById('dso-part').value;
    if (!soNum || !cust || !partNo) { toast('SO Number, Customer, Part No는 필수입니다', 'error'); return; }

    const rec = {
        id: document.getElementById('dso-id').value || Date.now().toString(),
        so_number: soNum,
        customer_po: document.getElementById('dso-cust-po').value.trim(),
        customer: cust,
        part_no: partNo,
        qty: parseInt(document.getElementById('dso-qty').value) || 0,
        shipped_qty: parseInt(document.getElementById('dso-shipped-qty').value) || 0,
        unit_price: parseFloat(document.getElementById('dso-price').value) || 0,
        currency: document.getElementById('dso-currency').value,
        due_date: document.getElementById('dso-due').value,
        status: document.getElementById('dso-status').value,
        remarks: document.getElementById('dso-remarks').value.trim(),
    };
    await DB.upsert('salesorders', rec, 'so_number');
    toast(`SO ${rec.so_number} 저장됨`, 'success');
    closeDP();
    renderSalesOrders();
}

async function deleteSO() {
    const id = document.getElementById('dso-id').value;
    if (!id || !confirm('이 Sales Order를 삭제하시겠습니까?')) return;
    const all = await DB.get('salesorders');
    const filtered = all.filter(r => r.id !== id);
    localStorage.setItem('scm_salesorders', JSON.stringify(filtered));
    toast('Sales Order 삭제됨', 'success');
    closeDP();
    renderSalesOrders();
}

// ── Excel Upload for SO ────────────────────────────
async function importSOFromExcel(input) {
    const file = input.files?.[0];
    if (!file) return;
    try {
        const ab = await file.arrayBuffer();
        const wb = XLSX.read(ab);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        let imported = 0;
        for (const r of rows) {
            const soNum = String(r['so_number'] || r['SO Number'] || r['SO_NUMBER'] || '').trim();
            const customer = String(r['customer'] || r['Customer'] || '').trim();
            const partNo = String(r['part_no'] || r['Part No'] || r['PART_NO'] || '').trim();
            if (!soNum || !customer || !partNo) continue;
            const rec = {
                id: `so-${soNum}`.replace(/[^a-zA-Z0-9-]/g, '_'),
                so_number: soNum,
                customer_po: String(r['customer_po'] || r['Customer PO'] || '').trim(),
                customer,
                part_no: partNo,
                qty: parseInt(r['qty'] || r['Qty'] || 0) || 0,
                shipped_qty: 0,
                unit_price: parseFloat(r['unit_price'] || r['Unit Price'] || 0) || 0,
                currency: String(r['currency'] || 'USD').trim(),
                due_date: String(r['due_date'] || r['Due Date'] || '').trim(),
                status: String(r['status'] || 'open').trim().toLowerCase(),
                remarks: String(r['remarks'] || '').trim(),
            };
            await DB.upsert('salesorders', rec, 'so_number');
            imported++;
        }
        toast(`📥 ${imported}건 Sales Order 업로드 완료`, 'success', 4000);
        input.value = '';
        renderSalesOrders();
    } catch (e) {
        toast('엑셀 파싱 오류: ' + e.message, 'error');
    }
}

// ── Issue Invoice for Selected SOs ─────────────────
async function issueSelectedInvoice() {
    const checked = [...document.querySelectorAll('.so-check:checked')];
    if (!checked.length) { toast('인보이스 발행할 SO를 선택하세요', 'error'); return; }
    const all = await DB.get('salesorders');
    const ids = checked.map(c => c.dataset.id);
    const selected = all.filter(s => ids.includes(s.id));
    if (!selected.length) return;

    const invNo = generateINVNumber();
    const today = new Date().toISOString().slice(0, 10);
    const dueDate = (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })();
    const totalAmt = selected.reduce((s, r) => s + (parseFloat(r.unit_price) || 0) * (parseInt(r.qty) || 0), 0);
    const cust = selected[0].customer;
    const currency = selected[0].currency || 'USD';

    // Save invoice
    const invRec = {
        id: Date.now().toString(),
        invoice_no: invNo,
        customer: cust,
        issue_date: today,
        due_date: dueDate,
        total_amount: totalAmt,
        currency,
        status: 'issued',
        so_refs: JSON.stringify(selected.map(s => s.so_number)),
        lines: JSON.stringify(selected.map(s => ({
            part_no: s.part_no,
            qty: s.qty,
            unit_price: s.unit_price,
            amount: (s.qty || 0) * (s.unit_price || 0),
        }))),
        remarks: '',
    };
    await DB.upsert('salesinvoices', invRec, 'invoice_no');

    // Mark SOs as invoiced
    for (const s of selected) {
        await DB.upsert('salesorders', { ...s, status: 'invoiced', invoice_ref: invNo }, 'so_number');
    }

    // Show print modal
    document.getElementById('invoice-body').innerHTML = generateInvoiceHTML(invRec, selected);
    const modal = document.getElementById('invoice-print-modal');
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    toast(`📄 Invoice ${invNo} 발행 완료`, 'success');
    renderSalesOrders();
}

function generateInvoiceHTML(inv, lines) {
    const fmt = n => parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const lineRows = lines.map(l => `
                <tr style="border-bottom:1px solid #eee">
                    <td style="padding:8px 4px">${l.part_no}</td>
                    <td style="padding:8px 4px;text-align:right">${(l.qty || 0).toLocaleString()}</td>
                    <td style="padding:8px 4px;text-align:right">${fmt(l.unit_price)}</td>
                    <td style="padding:8px 4px;text-align:right"><b>${fmt((l.qty || 0) * (l.unit_price || 0))}</b></td>
                </tr>`).join('');
    const total = parseFloat(inv.total_amount || 0);
    const tax = total * 0.1;
    const grand = total + tax;
    return `
            <div style="font-family:Arial,sans-serif;color:#111;max-width:600px;margin:0 auto">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #0a84ff">
                    <div>
                        <div style="font-size:28px;font-weight:700;color:#0a84ff">INVOICE</div>
                        <div style="font-size:13px;color:#666;margin-top:4px">${inv.invoice_no}</div>
                    </div>
                    <div style="text-align:right;font-size:12px;color:#555">
                        <div style="font-size:16px;font-weight:600">KBAMAS Co., Ltd.</div>
                        <div>Issue Date: ${inv.issue_date}</div>
                        <div>Due Date: <b style="color:#e53935">${inv.due_date}</b></div>
                        <div>Payment Terms: NET 30</div>
                    </div>
                </div>
                <div style="margin-bottom:20px">
                    <div style="font-size:11px;text-transform:uppercase;color:#999;margin-bottom:4px">Bill To</div>
                    <div style="font-size:15px;font-weight:600">${inv.customer}</div>
                </div>
                <table style="width:100%;border-collapse:collapse;font-size:13px">
                    <thead>
                        <tr style="background:#f5f5f5">
                            <th style="padding:8px 4px;text-align:left">Part No</th>
                            <th style="padding:8px 4px;text-align:right">Qty</th>
                            <th style="padding:8px 4px;text-align:right">Unit Price</th>
                            <th style="padding:8px 4px;text-align:right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>${lineRows}</tbody>
                </table>
                <div style="margin-top:16px;text-align:right;font-size:13px">
                    <div>Subtotal: ${inv.currency} ${fmt(total)}</div>
                    <div>Tax (10%): ${inv.currency} ${fmt(tax)}</div>
                    <div style="font-size:16px;font-weight:700;margin-top:8px;color:#0a84ff">
                        Grand Total: ${inv.currency} ${fmt(grand)}
                    </div>
                </div>
                <div style="margin-top:24px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999">
                    Thank you for your business. Please transfer payment by the due date.
                </div>
            </div>`;
}

// ════════════════════════════════════════════════════
// PHASE 2: AP / AR DASHBOARD
// ════════════════════════════════════════════════════

async function renderAPAR() {
    await renderARTable();
    await renderAPTable();
    await renderInvoiceTable();
    await updateAPARKPIs();
}

async function updateAPARKPIs() {
    const today = new Date().toISOString().slice(0, 10);
    const invoices = await DB.get('salesinvoices');
    const polist = await DB.get('polist');

    // AR
    const arPending = invoices.filter(i => i.status !== 'paid');
    const arTotal = arPending.reduce((s, i) => s + (parseFloat(i.total_amount) || 0), 0);
    const arOverdue = arPending.filter(i => i.due_date && i.due_date < today).length;
    document.getElementById('apar-kpi-ar').textContent = '$' + arTotal.toLocaleString(undefined, { minimumFractionDigits: 0 });
    document.getElementById('apar-kpi-ar-overdue').textContent = arOverdue > 0 ? `⚠ ${arOverdue}건 연체` : '✓ 연체 없음';

    // AP — issued POs (treat PO total value as AP, payment terms 30d from PO date)
    const apPending = polist.filter(p => p.status === 'issued' || p.status === 'partial');
    const apTotal = apPending.reduce((s, p) => s + (parseFloat(p.total_value) || 0), 0);
    const apOverdue = apPending.filter(p => {
        if (!p.date) return false;
        const due = new Date(p.date); due.setDate(due.getDate() + 30);
        return due.toISOString().slice(0, 10) < today;
    }).length;
    document.getElementById('apar-kpi-ap').textContent = '$' + apTotal.toLocaleString(undefined, { minimumFractionDigits: 0 });
    document.getElementById('apar-kpi-ap-overdue').textContent = apOverdue > 0 ? `⚠ ${apOverdue}건 연체` : '✓ 연체 없음';

    // Net
    const net = arTotal - apTotal;
    const netEl = document.getElementById('apar-kpi-net');
    netEl.textContent = (net >= 0 ? '+' : '') + '$' + Math.abs(net).toLocaleString(undefined, { minimumFractionDigits: 0 });
    netEl.style.color = net >= 0 ? 'var(--green)' : 'var(--red)';
}

async function renderARTable() {
    const today = new Date().toISOString().slice(0, 10);
    const invoices = await DB.get('salesinvoices');
    const q = document.getElementById('ar-search')?.value.toLowerCase() || '';
    const stF = document.getElementById('ar-filter-status')?.value || '';

    let rows = invoices.filter(i => {
        const eff = i.status === 'issued' && i.due_date && i.due_date < today ? 'overdue' : i.status;
        if (stF && eff !== stF) return false;
        if (q && !(`${i.invoice_no}${i.customer}`).toLowerCase().includes(q)) return false;
        return true;
    });

    const tbody = document.getElementById('ar-tbody');
    if (!tbody) return;
    tbody.innerHTML = rows.length ? rows.map(i => {
        const isOverdue = i.status === 'issued' && i.due_date && i.due_date < today;
        const effStatus = isOverdue ? 'overdue' : i.status;
        const stCls = { issued: 'a', paid: 'g', overdue: 'r' }[effStatus] || '';
        const days = i.due_date ? Math.round((new Date(today) - new Date(i.due_date)) / 86400000) : 0;
        const daysStr = effStatus === 'overdue' ? `<span style="color:var(--red)">+${days}d</span>` :
            effStatus === 'paid' ? '—' : `${Math.abs(days)}d left`;
        return `<tr>
                    <td><b>${i.invoice_no}</b></td>
                    <td>${i.customer}</td>
                    <td>${i.issue_date}</td>
                    <td>${i.due_date || '—'}</td>
                    <td style="text-align:right"><b>$${parseFloat(i.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></td>
                    <td><span class="badge ${stCls}">${effStatus}</span></td>
                    <td>${daysStr}</td>
                    <td>
                        ${i.status !== 'paid' ? `<button class="btn btn-g btn-sm" onclick="markARPaid('${i.invoice_no}')">✓ Paid</button>` : ''}
                    </td>
                </tr>`;
    }).join('') : '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--t3)">No invoices</td></tr>';

    document.getElementById('ar-count').textContent = `${rows.length} invoices`;
}

async function markARPaid(invNo) {
    const all = await DB.get('salesinvoices');
    const rec = all.find(i => i.invoice_no === invNo);
    if (!rec) return;
    await DB.upsert('salesinvoices', { ...rec, status: 'paid', payment_date: new Date().toISOString().slice(0, 10) }, 'invoice_no');
    toast(`${invNo} 수금 완료 처리`, 'success');
    await renderAPAR();
}

async function renderAPTable() {
    const today = new Date().toISOString().slice(0, 10);
    const polist = await DB.get('polist');
    const q = document.getElementById('ap-search')?.value.toLowerCase() || '';
    const stF = document.getElementById('ap-filter-status')?.value || '';

    let rows = polist.filter(p => {
        if (p.status === 'received' || p.status === 'cancelled' || p.status === 'draft') return false;
        const dueD = (() => { if (!p.date) return ''; const d = new Date(p.date); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })();
        const apSt = p.ap_status || (dueD && dueD < today ? 'overdue' : 'pending');
        if (stF && apSt !== stF) return false;
        if (q && !(`${p.po_number}${p.vendor_code}`).toLowerCase().includes(q)) return false;
        return true;
    });

    const tbody = document.getElementById('ap-tbody');
    if (!tbody) return;
    tbody.innerHTML = rows.length ? rows.map(p => {
        const dueD = (() => { if (!p.date) return ''; const d = new Date(p.date); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })();
        const apSt = p.ap_status || (dueD && dueD < today ? 'overdue' : 'pending');
        const stCls = { pending: 'a', paid: 'g', overdue: 'r' }[apSt] || '';
        const days = dueD ? Math.round((new Date(today) - new Date(dueD)) / 86400000) : 0;
        const daysStr = apSt === 'overdue' ? `<span style="color:var(--red)">+${days}d</span>` :
            apSt === 'paid' ? '—' : (dueD ? `${Math.abs(days)}d left` : '—');
        return `<tr>
                    <td><b>${p.po_number}</b></td>
                    <td>${p.vendor_code}</td>
                    <td>${p.date || '—'}</td>
                    <td>${dueD || '—'}</td>
                    <td style="text-align:right"><b>$${parseFloat(p.total_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></td>
                    <td><span class="badge ${stCls}">${apSt}</span></td>
                    <td>${daysStr}</td>
                    <td>${apSt !== 'paid' ? `<button class="btn btn-g btn-sm" onclick="markAPPaid('${p.po_number}')">✓ Paid</button>` : ''}</td>
                </tr>`;
    }).join('') : '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--t3)">No AP records</td></tr>';

    document.getElementById('ap-count').textContent = `${rows.length} POs`;
}

async function markAPPaid(poNum) {
    const all = await DB.get('polist');
    const rec = all.find(p => p.po_number === poNum);
    if (!rec) return;
    await DB.upsert('polist', { ...rec, ap_status: 'paid' }, 'po_number');
    toast(`${poNum} AP 지급 완료 처리`, 'success');
    await renderAPAR();
}

async function renderInvoiceTable() {
    const all = await DB.get('salesinvoices');
    const q = document.getElementById('inv-search')?.value.toLowerCase() || '';
    const rows = all.filter(i => !q || `${i.invoice_no}${i.customer}`.toLowerCase().includes(q));
    const tbody = document.getElementById('inv-tbody');
    if (!tbody) return;
    const stCls = { issued: 'a', paid: 'g', overdue: 'r' };
    tbody.innerHTML = rows.length ? rows.map(i => `<tr>
                <td><b>${i.invoice_no}</b></td>
                <td>${i.customer}</td>
                <td>${i.issue_date}</td>
                <td style="text-align:right">$${parseFloat(i.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td><span class="badge ${stCls[i.status] || ''}">${i.status}</span></td>
                <td><button class="btn btn-g btn-sm" onclick="reprIntInvoice('${i.invoice_no}')">🖨 Print</button></td>
            </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--t3)">No invoices yet</td></tr>';
    document.getElementById('inv-count').textContent = `${rows.length} invoices`;
}

async function reprIntInvoice(invNo) {
    const all = await DB.get('salesinvoices');
    const inv = all.find(i => i.invoice_no === invNo);
    if (!inv) return;
    let lines;
    try { lines = typeof inv.lines === 'string' ? JSON.parse(inv.lines) : inv.lines; }
    catch { lines = []; }
    document.getElementById('invoice-body').innerHTML = generateInvoiceHTML(inv, lines);
    const modal = document.getElementById('invoice-print-modal');
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
}

function switchAPARTab(tab) {
    ['ar', 'ap', 'inv'].forEach(t => {
        document.getElementById('apar-panel-' + t).style.display = t === tab ? '' : 'none';
        const btn = document.getElementById('apar-tab-' + t);
        if (btn) { btn.className = t === tab ? 'btn btn-p btn-sm' : 'btn btn-g btn-sm'; }
    });
    if (tab === 'ar') renderARTable();
    else if (tab === 'ap') renderAPTable();
    else renderInvoiceTable();
}

async function exportAPAR() {
    const invoices = await DB.get('salesinvoices');
    const csv = ['Invoice No,Customer,Issue Date,Due Date,Amount,Status']
        .concat(invoices.map(i => `${i.invoice_no},${i.customer},${i.issue_date},${i.due_date || ''},${i.total_amount || 0},${i.status}`))
        .join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'apar_export.csv';
    a.click();
}

// (dp-so is handled via the merged openDP hook above)

// ════════════════════════════════════════════════════
// PHASE 3: WORK ORDERS
// ════════════════════════════════════════════════════

let _woChartInventory = null;
let _woChartStatus = null;

function generateWONumber() {
    const y = new Date().getFullYear();
    return `WO-${y}-${String(Date.now()).slice(-4)}`;
}

async function renderWorkOrders() {
    const all = await DB.get('workorders');
    const q = (document.getElementById('wo-search')?.value || '').toLowerCase();
    const stF = document.getElementById('wo-filter-status')?.value || '';
    const prF = document.getElementById('wo-filter-priority')?.value || '';

    const rows = all.filter(w => {
        if (stF && w.status !== stF) return false;
        if (prF && w.priority !== prF) return false;
        if (q && !(`${w.wo_number}${w.part_no}${w.mrp_ref}`).toLowerCase().includes(q)) return false;
        return true;
    });

    const ST_BADGE = { planned: 'a', released: 'c', in_progress: '', completed: 'g', cancelled: 'r' };
    const PR_ICON = { high: '🔴', medium: '🟡', low: '🟢' };
    const tbody = document.getElementById('wo-tbody');
    if (!tbody) return;
    tbody.innerHTML = rows.length ? rows.map(w => {
        const pct = parseInt(w.progress) || 0;
        return `<tr>
                    <td><b>${w.wo_number}</b></td>
                    <td>${w.part_no || '—'}</td>
                    <td style="text-align:right">${(w.qty || 0).toLocaleString()}</td>
                    <td>${w.due_date || '—'}</td>
                    <td>${PR_ICON[w.priority] || ''} ${w.priority}</td>
                    <td><span class="badge ${ST_BADGE[w.status] || ''}">${w.status}</span></td>
                    <td>
                        <div style="display:flex;align-items:center;gap:6px">
                            <div style="flex:1;height:6px;background:var(--border);border-radius:3px">
                                <div style="width:${pct}%;height:100%;background:var(--green);border-radius:3px"></div>
                            </div>
                            <span style="font-size:11px;color:var(--t3)">${pct}%</span>
                        </div>
                    </td>
                    <td style="font-size:11px;color:var(--t3)">${w.mrp_ref || '—'}</td>
                    <td><button class="btn btn-g btn-sm" onclick="openDP('dp-wo','edit',${JSON.stringify(w).replace(/"/g, '&quot;')})">Edit</button></td>
                </tr>`;
    }).join('') : '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--t3)">No work orders. Click + New WO or Generate from MRP.</td></tr>';

    // KPI
    document.getElementById('wo-kpi-total').textContent = all.length;
    document.getElementById('wo-kpi-planned').textContent = all.filter(w => w.status === 'planned').length;
    document.getElementById('wo-kpi-inprog').textContent = all.filter(w => w.status === 'in_progress').length;
    document.getElementById('wo-kpi-done').textContent = all.filter(w => w.status === 'completed').length;
    document.getElementById('wo-count').textContent = `${rows.length} orders`;
}

async function prepWOPanel(mode, data) {
    const isNew = mode === 'new';
    document.getElementById('dp-wo-title').textContent = isNew ? 'New Work Order' : `WO: ${data?.wo_number}`;
    document.getElementById('dp-wo-sub').textContent = data?.status || 'planned';
    document.getElementById('wo-delete-btn').style.display = isNew ? 'none' : '';

    const products = await DB.get('products');
    document.getElementById('dwo-part').innerHTML = '<option value="">— Select Part —</option>' +
        products.map(p => `<option value="${p.part_no}">${p.part_no} — ${p.part_name || ''}</option>`).join('');

    document.getElementById('dwo-id').value = data?.id || '';
    document.getElementById('dwo-number').value = data?.wo_number || generateWONumber();
    document.getElementById('dwo-part').value = data?.part_no || '';
    document.getElementById('dwo-qty').value = data?.qty || '';
    document.getElementById('dwo-due').value = data?.due_date || '';
    document.getElementById('dwo-priority').value = data?.priority || 'medium';
    document.getElementById('dwo-status').value = data?.status || 'planned';
    const pct = parseInt(data?.progress) || 0;
    document.getElementById('dwo-progress').value = pct;
    document.getElementById('dwo-progress-val').textContent = pct + '%';
    document.getElementById('dwo-mrp-ref').value = data?.mrp_ref || '';
    document.getElementById('dwo-remarks').value = data?.remarks || '';
}

async function saveWO() {
    const woNum = document.getElementById('dwo-number').value.trim();
    const partNo = document.getElementById('dwo-part').value;
    if (!woNum || !partNo) { toast('WO Number와 Part No는 필수입니다', 'error'); return; }

    const rec = {
        id: document.getElementById('dwo-id').value || Date.now().toString(),
        wo_number: woNum,
        part_no: partNo,
        qty: parseInt(document.getElementById('dwo-qty').value) || 0,
        due_date: document.getElementById('dwo-due').value,
        priority: document.getElementById('dwo-priority').value,
        status: document.getElementById('dwo-status').value,
        progress: parseInt(document.getElementById('dwo-progress').value) || 0,
        mrp_ref: document.getElementById('dwo-mrp-ref').value.trim(),
        remarks: document.getElementById('dwo-remarks').value.trim(),
    };

    // 완료 처리 시 progress 100 자동
    if (rec.status === 'completed') rec.progress = 100;
    await DB.upsert('workorders', rec, 'wo_number');
    toast(`WO ${rec.wo_number} 저장됨`, 'success');
    closeDP();
    renderWorkOrders();
}

async function deleteWO() {
    const id = document.getElementById('dwo-id').value;
    if (!id || !confirm('이 Work Order를 삭제하시겠습니까?')) return;
    const all = await DB.get('workorders');
    localStorage.setItem('scm_workorders', JSON.stringify(all.filter(r => r.id !== id)));
    toast('Work Order 삭제됨', 'success');
    closeDP();
    renderWorkOrders();
}

// ── MRP Shortage → WO 자동 생성 ──────────────────────
async function generateWOFromMRP() {
    if (!MRP_RESULTS || MRP_RESULTS.length === 0) {
        toast('먼저 MRP를 실행해 주세요 (MRP 페이지)', 'error'); return;
    }
    const shortages = MRP_RESULTS.filter(r => r.shortage && r.shortage > 0);
    if (!shortages.length) { toast('현재 MRP Shortage 없음', 'success'); return; }

    let created = 0;
    const today = new Date().toISOString().slice(0, 10);
    const existing = await DB.get('workorders');
    const existingParts = new Set(existing.map(w => w.part_no + '_' + w.due_date));

    for (const s of shortages) {
        const key = `${s.part_no}_${s.due_date || today}`;
        if (existingParts.has(key)) continue; // 중복 방지
        const rec = {
            id: `wo-${s.part_no}-${Date.now()}`,
            wo_number: generateWONumber(),
            part_no: s.part_no,
            qty: Math.ceil(s.shortage),
            due_date: s.due_date || today,
            priority: s.shortage > 1000 ? 'high' : 'medium',
            status: 'planned',
            progress: 0,
            mrp_ref: `MRP-${new Date().getFullYear()}`,
            remarks: `Auto from MRP: shortage ${s.shortage}`,
        };
        await DB.upsert('workorders', rec, 'wo_number');
        created++;
    }
    toast(`⚡ ${created}건 Work Order 자동 생성됨`, 'success', 4000);
    renderWorkOrders();
}

// ── openDP 훅에 dp-wo 추가 ────────────────────────────
// (기존 merged openDP hook에 통합)
const _origOpenDP2 = window.openDP;
window.openDP = async function (id, mode, data) {
    if (id === 'dp-wo') {
        document.getElementById('dp-overlay')?.classList.add('open');
        document.getElementById('dp-wo')?.classList.add('open');
        await prepWOPanel(mode, data ? (typeof data === 'string' ? JSON.parse(data) : data) : null);
        return;
    }
    await _origOpenDP2(id, mode, data);
};

// PAGE_INIT 등록
PAGE_INIT.workorder = renderWorkOrders;

// ════════════════════════════════════════════════════
// PHASE 3: DASHBOARD CHARTS (Chart.js)
// ════════════════════════════════════════════════════

async function renderInventoryChart() {
    const canvas = document.getElementById('chart-inventory');
    if (!canvas || typeof Chart === 'undefined') return;
    const inv = await DB.get('inventory');

    // Part별 on-hand 합산 (top 10)
    const mapOH = {};
    inv.filter(i => i.location === 'onhand').forEach(i => {
        mapOH[i.part_no] = (mapOH[i.part_no] || 0) + (parseInt(i.qty) || 0);
    });
    const mapIT = {};
    inv.filter(i => i.location === 'intransit').forEach(i => {
        mapIT[i.part_no] = (mapIT[i.part_no] || 0) + (parseInt(i.qty) || 0);
    });

    const allParts = [...new Set([...Object.keys(mapOH), ...Object.keys(mapIT)])];
    const sorted = allParts.sort((a, b) => (mapOH[b] || 0) - (mapOH[a] || 0)).slice(0, 10);

    if (_woChartInventory) { _woChartInventory.destroy(); _woChartInventory = null; }
    _woChartInventory = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: sorted,
            datasets: [
                {
                    label: 'On-Hand',
                    data: sorted.map(p => mapOH[p] || 0),
                    backgroundColor: 'rgba(0,229,160,0.7)',
                    borderRadius: 4,
                },
                {
                    label: 'In-Transit',
                    data: sorted.map(p => mapIT[p] || 0),
                    backgroundColor: 'rgba(0,160,255,0.6)',
                    borderRadius: 4,
                },
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#aaa', font: { size: 11 } } } },
            scales: {
                x: { ticks: { color: '#aaa', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#aaa', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
            }
        }
    });
}

async function renderWOStatusChart() {
    const canvas = document.getElementById('chart-wo-status');
    if (!canvas || typeof Chart === 'undefined') return;
    const wos = await DB.get('workorders');

    const counts = {
        planned: wos.filter(w => w.status === 'planned').length,
        released: wos.filter(w => w.status === 'released').length,
        in_progress: wos.filter(w => w.status === 'in_progress').length,
        completed: wos.filter(w => w.status === 'completed').length,
        cancelled: wos.filter(w => w.status === 'cancelled').length,
    };
    const labels = Object.keys(counts).filter(k => counts[k] > 0);
    const values = labels.map(k => counts[k]);
    if (!values.length) { values.push(1); labels.push('No WOs'); }

    if (_woChartStatus) { _woChartStatus.destroy(); _woChartStatus = null; }
    _woChartStatus = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: ['#f5a623', '#0070f3', '#00e5a0', '#6b7280', '#ef4444'],
                borderWidth: 0,
            }]
        },
        options: {
            responsive: true,
            cutout: '65%',
            plugins: { legend: { labels: { color: '#aaa', font: { size: 11 } } } }
        }
    });
}

// Dashboard 초기화 훅 확장
async function initDashboardCharts() {
    await renderInventoryChart();
    await renderWOStatusChart();
}
if (PAGE_INIT.dashboard) {
    const _prevDash = PAGE_INIT.dashboard;
    PAGE_INIT.dashboard = async function () { await _prevDash(); initDashboardCharts(); };
} else {
    PAGE_INIT.dashboard = initDashboardCharts;
}
// 앱 초기 로드 시에도 차트 그리기 (현재 대시보드가 active이므로)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initDashboardCharts, 800);
});

// ════════════════════════════════════════════════════
// PHASE 3: 출고 배송 추적 (Outbound Shipment)
// ════════════════════════════════════════════════════

async function shipSalesOrder(soId, trackingNo, shippedQty) {
    const all = await DB.get('salesorders');
    const so = all.find(s => s.id === soId);
    if (!so) return;

    const sQty = parseInt(shippedQty) || parseInt(so.qty) || 0;

    // 1) SO 상태 업데이트
    const updated = { ...so, status: 'shipped', shipped_qty: sQty, tracking_no: trackingNo };
    await DB.upsert('salesorders', updated, 'so_number');

    // 2) 출고 이력 기록
    const shipRec = {
        id: Date.now().toString(),
        shipment_no: `SHIP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        so_number: so.so_number,
        customer: so.customer,
        part_no: so.part_no,
        shipped_qty: sQty,
        tracking_no: trackingNo,
        ship_date: new Date().toISOString().slice(0, 10),
        status: 'shipped',
    };
    await DB.upsert('outbound_shipments', shipRec, 'shipment_no');

    // 3) 재고 차감 (on-hand)
    const invAll = await DB.get('inventory');
    const oh = invAll.find(i => i.part_no === so.part_no && i.location === 'onhand');
    if (oh) {
        const newQty = Math.max(0, (parseInt(oh.qty) || 0) - sQty);
        await DB.upsert('inventory', { ...oh, qty: newQty }, 'id');
    }

    toast(`🚚 ${so.so_number} 출고 처리 완료 (추적번호: ${trackingNo || 'N/A'})`, 'success', 4000);
}

// SO 페이지: "Ship" 버튼 핸들러 (테이블 행에서 직접 호출)
async function openShipDialog(soId) {
    const all = await DB.get('salesorders');
    const so = all.find(s => s.id === soId);
    if (!so) return;
    const tracking = prompt(`${so.so_number} — 배송 추적번호(Tracking No) 입력 (없으면 빈칸):`);
    if (tracking === null) return; // 취소
    const shippedQty = prompt(`출고 수량 입력 (주문 수량: ${so.qty}):`, so.qty);
    if (shippedQty === null) return;
    await shipSalesOrder(soId, tracking.trim(), shippedQty);
    renderSalesOrders();
}

console.log('%cSCM Pro — Phase 3: Work Orders + Charts + Shipment ✓', 'color:#00E5A0;font-weight:bold');


// @media print CSS for invoice
const printStyle = document.createElement('style');
printStyle.textContent = `
            @media print {
                body > *:not(#invoice-print-modal) { display: none !important; }
                #invoice-print-modal { display: block !important; position: static !important; background: none !important; }
                #invoice-print-content { position: static !important; box-shadow: none !important; max-height: none !important; }
                .btn { display: none !important; }
            }
        `;
document.head.appendChild(printStyle);

