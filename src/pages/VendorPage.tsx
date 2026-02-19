import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { DataTable } from '../components/DataTable';
import { DetailPanel } from '../components/DetailPanel';
import { Plus, Download, Globe, Building2, CreditCard } from 'lucide-react';
import { Vendor } from '../types';

export function VendorPage() {
    const { vendors, upsertRecord, deleteRecord } = useStore();
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [activeVendor, setActiveVendor] = useState<Partial<Vendor> | null>(null);

    const columns = [
        {
            header: 'Code',
            accessor: 'vendor_code' as keyof Vendor,
            className: 'mono tc'
        },
        {
            header: 'Name',
            accessor: 'vendor_name' as keyof Vendor,
            className: 'tx fw'
        },
        {
            header: 'Country',
            accessor: 'country' as keyof Vendor
        },
        {
            header: 'City',
            accessor: 'city' as keyof Vendor
        },
        {
            header: 'Currency',
            accessor: 'default_currency' as keyof Vendor
        },
        {
            header: 'Status',
            accessor: (row: Vendor) => (
                <span className={`badge ${row.vendor_name && row.country ? 'badge-success' : 'badge-warning'}`}>
                    {row.vendor_name && row.country ? 'Active' : 'Incomplete'}
                </span>
            )
        }
    ];

    const handleAdd = () => {
        setActiveVendor({
            vendor_code: '',
            vendor_name: '',
            country: '',
            default_currency: 'USD'
        });
        setIsPanelOpen(true);
    };

    const handleEdit = (vendor: Vendor) => {
        setActiveVendor(vendor);
        setIsPanelOpen(true);
    };

    const handleSave = (data: any) => {
        upsertRecord('vendors', data as Vendor);
        setIsPanelOpen(false);
    };

    const handleDelete = () => {
        if (activeVendor?.id) {
            if (window.confirm('Are you sure you want to delete this vendor?')) {
                deleteRecord('vendors', activeVendor.id);
                setIsPanelOpen(false);
            }
        }
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <div className="header-text">
                    <h1>Vendors</h1>
                    <p>Manage your global supplier master and contact information.</p>
                </div>
                <div className="header-actions">
                    <button className="toolbar-btn"><Download size={18} /> Export</button>
                    <button className="primary-btn" onClick={handleAdd}><Plus size={18} /> Add Vendor</button>
                </div>
            </div>

            <DataTable
                data={vendors}
                columns={columns}
                onRowClick={handleEdit}
                searchField="vendor_name"
                searchPlaceholder="Search by vendor name..."
            />

            <DetailPanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                title={activeVendor?.id ? 'Edit Vendor' : 'New Vendor'}
                initialData={activeVendor}
                onSave={handleSave}
                onDelete={handleDelete}
            >
                <div className="form-section">
                    <div className="section-title">
                        <Building2 size={16} />
                        <span>Basic Information</span>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Vendor Code</label>
                            <input
                                className="form-input mono"
                                value={activeVendor?.vendor_code || ''}
                                onChange={e => setActiveVendor(prev => ({ ...prev, vendor_code: e.target.value.toUpperCase() }))}
                                placeholder="e.g. KBA"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Vendor Name</label>
                            <input
                                className="form-input"
                                value={activeVendor?.vendor_name || ''}
                                onChange={e => setActiveVendor(prev => ({ ...prev, vendor_name: e.target.value }))}
                                placeholder="Company Name"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <div className="section-title">
                        <Globe size={16} />
                        <span>Geography & Currency</span>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Country</label>
                            <input
                                className="form-input"
                                value={activeVendor?.country || ''}
                                onChange={e => setActiveVendor(prev => ({ ...prev, country: e.target.value.toUpperCase() }))}
                                placeholder="KOR / USA / DEU"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Currency</label>
                            <select
                                className="form-input"
                                value={activeVendor?.default_currency || 'USD'}
                                onChange={e => setActiveVendor(prev => ({ ...prev, default_currency: e.target.value }))}
                            >
                                <option value="USD">USD - US Dollar</option>
                                <option value="KRW">KRW - Korean Won</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="MXN">MXN - Mexican Peso</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">City</label>
                        <input
                            className="form-input"
                            value={activeVendor?.city || ''}
                            onChange={e => setActiveVendor(prev => ({ ...prev, city: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="form-section">
                    <div className="section-title">
                        <CreditCard size={16} />
                        <span>Banking</span>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Bank Name</label>
                        <input
                            className="form-input"
                            value={activeVendor?.bank_name || ''}
                            onChange={e => setActiveVendor(prev => ({ ...prev, bank_name: e.target.value }))}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Account Number</label>
                        <input
                            className="form-input"
                            value={activeVendor?.bank_account || ''}
                            onChange={e => setActiveVendor(prev => ({ ...prev, bank_account: e.target.value }))}
                        />
                    </div>
                </div>
            </DetailPanel>

            <style>{`
        .form-section {
          margin-bottom: 32px;
        }
        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          color: var(--accent);
          font-weight: 600;
          font-size: 14px;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
      `}</style>
        </div>
    );
}
