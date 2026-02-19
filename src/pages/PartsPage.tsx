import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { DataTable } from '../components/DataTable';
import { DetailPanel } from '../components/DetailPanel';
import { Plus, Download, Package as PackageIcon, Info, Tag } from 'lucide-react';
import { Part } from '../types';

export function PartsPage() {
    const { parts, vendors, upsertRecord, deleteRecord } = useStore();
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [activePart, setActivePart] = useState<Partial<Part> | null>(null);

    const columns = [
        { header: 'Part No', accessor: 'part_no' as keyof Part, className: 'mono tc' },
        { header: 'Name', accessor: 'part_name' as keyof Part, className: 'fw' },
        {
            header: 'Category',
            accessor: (row: Part) => (
                <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                    {row.category}
                </span>
            )
        },
        { header: 'Vendor', accessor: 'vendor_code' as keyof Part },
        {
            header: 'Price',
            accessor: (row: Part) => `${row.price.toLocaleString()} ${row.currency}`,
            className: 'mono'
        },
        { header: 'MOQ', accessor: 'moq' as keyof Part, className: 'mono' },
    ];

    const handleAdd = () => {
        setActivePart({
            part_no: '',
            part_name: '',
            category: 'Back Plate',
            vendor_code: vendors[0]?.vendor_code || '',
            price: 0,
            currency: 'USD',
            moq: 0,
            std_pack_size: 0,
            leadtime_mp: 0,
            unit: 'Pcs'
        });
        setIsPanelOpen(true);
    };

    const handleEdit = (part: Part) => {
        setActivePart(part);
        setIsPanelOpen(true);
    };

    const handleSave = (data: any) => {
        upsertRecord('parts', data as Part);
        setIsPanelOpen(false);
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <div className="header-text">
                    <h1>Parts Master</h1>
                    <p>Sub-material master and pricing information.</p>
                </div>
                <div className="header-actions">
                    <button className="toolbar-btn"><Download size={18} /> Export</button>
                    <button className="primary-btn" onClick={handleAdd}><Plus size={18} /> Add Part</button>
                </div>
            </div>

            <DataTable
                data={parts}
                columns={columns}
                onRowClick={handleEdit}
                searchField="part_name"
                searchPlaceholder="Search by part name or number..."
            />

            <DetailPanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                title={activePart?.id ? 'Edit Part' : 'New Part'}
                initialData={activePart}
                onSave={handleSave}
            >
                <div className="form-section">
                    <div className="section-title">
                        <PackageIcon size={16} />
                        <span>Identification</span>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Part Number</label>
                        <input
                            className="form-input mono"
                            value={activePart?.part_no || ''}
                            onChange={e => setActivePart(prev => ({ ...prev, part_no: e.target.value.toUpperCase() }))}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Part Name</label>
                        <input
                            className="form-input"
                            value={activePart?.part_name || ''}
                            onChange={e => setActivePart(prev => ({ ...prev, part_name: e.target.value }))}
                        />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <select
                                className="form-input"
                                value={activePart?.category || ''}
                                onChange={e => setActivePart(prev => ({ ...prev, category: e.target.value }))}
                            >
                                <option>Back Plate</option>
                                <option>Noise Shim</option>
                                <option>Clip</option>
                                <option>Sensor</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Vendor</label>
                            <select
                                className="form-input"
                                value={activePart?.vendor_code || ''}
                                onChange={e => setActivePart(prev => ({ ...prev, vendor_code: e.target.value }))}
                            >
                                {vendors.map(v => (
                                    <option key={v.id} value={v.vendor_code}>{v.vendor_code} - {v.vendor_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <div className="section-title">
                        <Tag size={16} />
                        <span>Pricing & Logistics</span>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Price</label>
                            <input
                                className="form-input mono"
                                type="number"
                                value={activePart?.price || 0}
                                onChange={e => setActivePart(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Currency</label>
                            <select
                                className="form-input"
                                value={activePart?.currency || 'USD'}
                                onChange={e => setActivePart(prev => ({ ...prev, currency: e.target.value }))}
                            >
                                <option>USD</option>
                                <option>KRW</option>
                                <option>EUR</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">MOQ</label>
                            <input
                                className="form-input mono"
                                type="number"
                                value={activePart?.moq || 0}
                                onChange={e => setActivePart(prev => ({ ...prev, moq: parseInt(e.target.value) }))}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Lead Time (Days)</label>
                            <input
                                className="form-input mono"
                                type="number"
                                value={activePart?.leadtime_mp || 0}
                                onChange={e => setActivePart(prev => ({ ...prev, leadtime_mp: parseInt(e.target.value) }))}
                            />
                        </div>
                    </div>
                </div>
            </DetailPanel>

            <style>{`
        .form-section { margin-bottom: 32px; }
        .section-title { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; color: var(--accent); font-weight: 600; font-size: 14px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      `}</style>
        </div>
    );
}
