import React, { useEffect, useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';

interface DetailPanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    onSave: (data: any) => void;
    onDelete?: () => void;
    initialData?: any;
    children: React.ReactNode;
}

export function DetailPanel({
    isOpen,
    onClose,
    title,
    onSave,
    onDelete,
    initialData,
    children
}: DetailPanelProps) {
    const [formData, setFormData] = useState(initialData || {});

    useEffect(() => {
        setFormData(initialData || {});
    }, [initialData]);

    if (!isOpen) return null;

    return (
        <>
            <div className="panel-overlay" onClick={onClose} />
            <div className={`detail-panel-container ${isOpen ? 'open' : ''}`}>
                <div className="panel-header">
                    <div className="header-info">
                        <h2>{title}</h2>
                        <p>{initialData?.id ? 'Edit existing record' : 'Create a new record'}</p>
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="panel-body">
                    {children}
                </div>

                <div className="panel-footer">
                    {onDelete && initialData?.id && (
                        <button className="delete-btn" onClick={onDelete}>
                            <Trash2 size={18} /> Delete
                        </button>
                    )}
                    <div className="footer-spacer"></div>
                    <button className="secondary-btn" onClick={onClose}>Cancel</button>
                    <button className="primary-btn" onClick={() => onSave(formData)}>
                        <Save size={18} /> Save Record
                    </button>
                </div>
            </div>
        </>
    );
}
