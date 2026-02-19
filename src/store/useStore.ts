import { create } from 'zustand';
import { Vendor, Part, Product, BomRow, User } from '../types';

interface SCMState {
    user: User | null;
    vendors: Vendor[];
    parts: Part[];
    products: Product[];
    bom: BomRow[];

    // Actions
    setUser: (user: User | null) => void;
    setVendors: (vendors: Vendor[]) => void;
    setParts: (parts: Part[]) => void;
    setProducts: (products: Product[]) => void;
    setBom: (bom: BomRow[]) => void;

    // Persistent Storage
    saveAll: () => void;
    loadAll: () => void;

    // CRUD Actions
    upsertRecord: <T extends { id: string }>(table: 'vendors' | 'parts' | 'products' | 'bom', record: T) => void;
    deleteRecord: (table: 'vendors' | 'parts' | 'products' | 'bom', id: string) => void;
}

export const useStore = create<SCMState>((set, get) => ({
    user: null,
    vendors: [],
    parts: [],
    products: [],
    bom: [],

    setUser: (user) => set({ user }),
    setVendors: (vendors) => set({ vendors }),
    setParts: (parts) => set({ parts }),
    setProducts: (products) => set({ products }),
    setBom: (bom) => set({ bom }),

    saveAll: () => {
        const state = get();
        localStorage.setItem('scm_vendors', JSON.stringify(state.vendors));
        localStorage.setItem('scm_parts', JSON.stringify(state.parts));
        localStorage.setItem('scm_products', JSON.stringify(state.products));
        localStorage.setItem('scm_bom', JSON.stringify(state.bom));
        if (state.user) localStorage.setItem('scm_sess', JSON.stringify(state.user));
    },

    loadAll: () => {
        const vendors = JSON.parse(localStorage.getItem('scm_vendors') || '[]');
        const parts = JSON.parse(localStorage.getItem('scm_parts') || '[]');
        const products = JSON.parse(localStorage.getItem('scm_products') || '[]');
        const bom = JSON.parse(localStorage.getItem('scm_bom') || '[]');
        const user = JSON.parse(localStorage.getItem('scm_sess') || 'null');

        if (vendors.length === 0) {
            const demoVendors = [
                { id: '1', vendor_code: 'KBA', vendor_name: 'K-Brake Advanced', country: 'KOR', city: 'Incheon', default_currency: 'KRW' },
                { id: '2', vendor_code: 'MMX', vendor_name: 'Max Motion Mexico', country: 'MEX', city: 'Queretaro', default_currency: 'USD' },
                { id: '3', vendor_code: 'ZF-G', vendor_name: 'ZF Germany', country: 'DEU', city: 'Friedrichshafen', default_currency: 'EUR' },
            ];
            const demoParts = [
                { id: 'p1', part_no: 'BP-001', part_name: 'Back Plate Front', category: 'Back Plate', vendor_code: 'KBA', in_out: 'in' as const, price: 1200, currency: 'KRW', moq: 1000, std_pack_size: 50, leadtime_mp: 45, unit: 'Pcs' },
                { id: 'p2', part_no: 'SH-502', part_name: 'Noise Shim RUB', category: 'Noise Shim', vendor_code: 'MMX', in_out: 'in' as const, price: 0.45, currency: 'USD', moq: 5000, std_pack_size: 200, leadtime_mp: 60, unit: 'Pcs' },
            ];
            set({ vendors: demoVendors, parts: demoParts, products, bom, user });
        } else {
            set({ vendors, parts, products, bom, user });
        }
    },

    upsertRecord: (table, record) => {
        set((state) => {
            const data = [...state[table]] as any[];
            const index = data.findIndex((r) => r.id === record.id);
            if (index >= 0) {
                data[index] = { ...data[index], ...record };
            } else {
                data.push({ ...record, id: record.id || Date.now().toString() });
            }

            const newState = { ...state, [table]: data };
            // Auto-save
            localStorage.setItem(`scm_${table}`, JSON.stringify(data));
            return newState;
        });
    },

    deleteRecord: (table, id) => {
        set((state) => {
            const data = (state[table] as any[]).filter((r) => r.id !== id);
            const newState = { ...state, [table]: data };
            localStorage.setItem(`scm_${table}`, JSON.stringify(data));
            return newState;
        });
    },
}));
