import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Search, Filter, MoreHorizontal } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Column<T> {
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (row: T) => void;
    searchPlaceholder?: string;
    searchField?: keyof T;
}

export function DataTable<T extends { id: string }>({
    data,
    columns,
    onRowClick,
    searchPlaceholder = "Search...",
    searchField
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);

    const filteredData = React.useMemo(() => {
        let result = [...data];

        if (searchTerm && searchField) {
            result = result.filter(item => {
                const value = item[searchField];
                return String(value).toLowerCase().includes(searchTerm.toLowerCase());
            });
        }

        if (sortConfig) {
            result.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [data, searchTerm, searchField, sortConfig]);

    const handleSort = (key: keyof T) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="table-container">
            <div className="table-toolbar">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="toolbar-actions">
                    <button className="toolbar-btn"><Filter size={18} /> Filter</button>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="modern-table">
                    <thead>
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={col.className}
                                    onClick={() => typeof col.accessor === 'string' && handleSort(col.accessor as keyof T)}
                                >
                                    <div className="header-content">
                                        {col.header}
                                        {typeof col.accessor === 'string' && sortConfig?.key === col.accessor && (
                                            sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                        )}
                                    </div>
                                </th>
                            ))}
                            <th className="action-col"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length > 0 ? (
                            filteredData.map((row) => (
                                <tr key={row.id} onClick={() => onRowClick?.(row)}>
                                    {columns.map((col, idx) => (
                                        <td key={idx} className={col.className}>
                                            {typeof col.accessor === 'function'
                                                ? col.accessor(row)
                                                : String(row[col.accessor as keyof T] || '—')}
                                        </td>
                                    ))}
                                    <td className="action-col">
                                        <button className="row-action-btn"><MoreHorizontal size={16} /></button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length + 1} className="empty-row">
                                    No records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
