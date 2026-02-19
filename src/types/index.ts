export interface Vendor {
    id: string;
    vendor_code: string;
    vendor_name: string;
    country: string;
    default_currency: string;
    payment_terms?: string;
    incoterms?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country_full?: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    fax?: string;
    bank_name?: string;
    bank_account?: string;
    swift_code?: string;
    iban?: string;
    remarks?: string;
}

export interface Part {
    id: string;
    part_no: string;
    part_name: string;
    category: string;
    vendor_code: string;
    in_out: 'in' | 'out';
    material?: string;
    price: number;
    currency: string;
    price_date?: string;
    hs_code?: string;
    moq: number;
    std_pack_size: number;
    leadtime_mp: number;
    leadtime_dev?: number;
    incoterms?: string;
    shipping_method?: string;
    safety_stock?: string;
    unit: string;
    remarks?: string;
}

export interface Product {
    id: string;
    part_no: string;
    kb_part_no?: string;
    car_code: string;
    sub_code?: string;
    part_name: string;
    customer: string;
    type: 'mp' | 'dev';
    price: number;
    currency: string;
    incoterms?: string;
    remarks?: string;
}

export interface BomRow {
    id: string;
    assy_part_no: string;
    part_no: string;
    lr: string;
    qty: number;
    car_code?: string;
    sub_code?: string;
    remarks?: string;
}

export interface User {
    name: string;
    role: string;
    av: string;
}
