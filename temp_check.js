
        // ── SUPABASE INTEGRATION ──────────────────────────────
        let supabase = null;

        async function setupSupabase() {
            if (typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
                supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
                console.log("Supabase Client Ready (via Config)");
                return;
            }
            const url = 'https://inhyqhtrpsjpiyywtfhw.supabase.co';
            let key = sessionStorage.getItem('SUPABASE_KEY');
            if (!key) {
                key = prompt("보안을 위해 Supabase Anon Key를 입력해주세요.");
                if (key) sessionStorage.setItem('SUPABASE_KEY', key);
            }
            if (key && window.supabase) {
                supabase = window.supabase.createClient(url, key);
                console.log("Supabase Client Ready (via Prompt)");
            }
        }

        // Auto-init if config exists
        if (typeof CONFIG !== 'undefined') {
            window.addEventListener('load', setupSupabase);
        }

        async function syncToDatabase(sheetName, rawData) {
            if (!supabase) await setupSupabase();
            if (!supabase) return;

            const tableName = sheetName.toLowerCase().split('_')[1];
            const cleanData = rawData.map(row => {
                const newRow = {};
                for (let key in row) {
                    let cleanKey = key.replace(' *', '').trim().toLowerCase();
                    if (cleanKey.includes('code')) cleanKey = cleanKey.replace('code', 'id');
                    if (cleanKey.includes('date')) {
                        if (row[key] instanceof Date) cleanKey = row[key].toISOString().slice(0, 10);
                        else if (typeof row[key] === 'string') cleanKey = row[key].split(' ')[0];
                    }
                    newRow[cleanKey] = row[key];
                }
                return newRow;
            });

            const { error } = await supabase
                .from(tableName)
                .upsert(cleanData, { onConflict: tableName.slice(0, -1) + '_id' });

            if (error) {
                toast(`${sheetName} Sync Fail: ` + error.message, 'error');
            } else {
                console.log(`${sheetName} Sync Success!`);
            }
        }

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
            nav('dashboard');
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

        // ── DB ABSTRACTION LAYER (Phase 1 = LocalStorage) ──────
        // To migrate to Supabase: replace only these function bodies
        const DB = {
            async get(table) { const r = localStorage.getItem(`scm_${table}`); return r ? JSON.parse(r) : []; },
            async save(table, data) { localStorage.setItem(`scm_${table}`, JSON.stringify(data)); return data; },
            async upsert(table, rec, key = 'id') {
                const data = await this.get(table);
                const i = data.findIndex(r => r[key] === rec[key]);
                if (i >= 0) data[i] = { ...data[i], ...rec }; else data.push({ ...rec, id: rec.id || Date.now().toString() });
                return this.save(table, data);
            },
            async delete(table, id, key = 'id') {
                const data = await this.get(table);
                return this.save(table, data.filter(r => r[key] !== id));
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
            const vsel = document.getElementById('dp-vendor');
            vsel.innerHTML = '<option value="">— Select vendor —</option>' +
                vendors.map(v => `<option value="${v.vendor_code}">${v.vendor_code} — ${v.vendor_name}</option>`).join('');

            const fields = ['id', 'partno', 'partname', 'category', 'inout', 'material', 'price', 'currency', 'pricedate', 'hscode', 'moq', 'packsize', 'ltmp', 'ltdev', 'incoterms', 'shipping', 'safetystock', 'unit', 'remarks'];
            const keys = ['id', 'part_no', 'part_name', 'category', 'in_out', 'material', 'price', 'currency', 'price_date', 'hs_code', 'moq', 'std_pack_size', 'leadtime_mp', 'leadtime_dev', 'incoterms', 'shipping_method', 'safety_stock', 'unit', 'remarks'];
            fields.forEach((f, i) => {
                const el = document.getElementById('dp-' + f);
                if (el) el.value = (data && data[keys[i]] !== undefined) ? data[keys[i]] : '';
            });
            if (data?.vendor_code) document.getElementById('dp-vendor').value = data.vendor_code;
        }

        async function savePart() {
            const rec = {
                id: document.getElementById('dp-id').value || Date.now().toString(),
                part_no: document.getElementById('dp-partno').value.trim(),
                part_name: document.getElementById('dp-partname').value.trim(),
                category: document.getElementById('dp-category').value,
                in_out: document.getElementById('dp-inout').value,
                vendor_code: document.getElementById('dp-vendor').value,
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

            // Sync to Supabase
            if (importPending) {
                for (const sheetName of Object.keys(importPending)) {
                    if (importPending[sheetName].rows.length > 0) {
                        await syncToDatabase(sheetName, importPending[sheetName].rows);
                    }
                }
                toast("All validated data synced to Supabase DB", "success");
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
        };


        // Hook into nav() to trigger page init
        const _navOrig = nav;
        window.nav = function (id) {
            _navOrig(id);
            if (PAGE_INIT[id]) PAGE_INIT[id]();
        };

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

            // Initial page render
            renderVendors();
            renderParts();
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
            toast('MRP calculation complete', 'success');
        }

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
        async function prepPOPanel(mode, data) {
            const isNew = mode === 'new';
            document.getElementById('dp-po-title').textContent = isNew ? 'New Purchase Order' : `PO: ${data?.po_number}`;
            document.getElementById('dp-po-sub').textContent = isNew ? 'Draft' : data?.status || 'Draft';
            document.getElementById('dpo-delete-btn').style.display = isNew ? 'none' : '';
            document.getElementById('dpo-issue-btn').style.display = (data?.status === 'draft' || !data) ? '' : 'none';

            // Vendor select
            const vendors = await DB.get('vendors');
            const vsel = document.getElementById('dpo-vendor');
            vsel.innerHTML = '<option value="">— Select Vendor —</option>' +
                vendors.map(v => `<option value="${v.vendor_code}">${v.vendor_code} — ${v.vendor_name}</option>`).join('');

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
            if (data?.vendor_code) document.getElementById('dpo-vendor').value = data.vendor_code;

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
            const rec = {
                id: document.getElementById('dpo-id').value || Date.now().toString(),
                po_number: poNum,
                vendor_code: vendor,
                date: document.getElementById('dpo-date').value,
                eta: document.getElementById('dpo-eta').value,
                total_value: total,
                currency: document.getElementById('dpo-currency').value,
                item_count: lines.length,
                progress: parseInt(document.getElementById('dpo-progress').value) || 0,
                status: document.getElementById('dpo-status').value,
                created_by: 'Admin',
                lines: JSON.stringify(lines),
                remarks: document.getElementById('dpo-remarks').value.trim(),
            };

            await DB.upsert('polist', rec, 'po_number');
            toast(`PO ${rec.po_number} 저장됨`, 'success');
            closeDP();
            renderPOList();
        }

        async function issuePO() {
            document.getElementById('dpo-status').value = 'issued';
            updatePOTimeline();
            await savePO();
            toast('PO 발행 완료', 'success');
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


    
