'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { StatusBadge, EmptyState } from '@/components/ui/SharedComponents';
import { formatDate, formatDateTime } from '@/lib/utils';
import { ClipboardList, Search, Filter } from 'lucide-react';

export default function SalesHistoryPage() {
    const { salesData } = useApp();
    const [statusFilter, setStatusFilter] = useState<'All' | 'Confirmed' | 'Rejected'>('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSales = useMemo(() => {
        let filtered = [...salesData];

        if (statusFilter !== 'All') {
            filtered = filtered.filter((s) => s.Status === statusFilter);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (s) =>
                    s.Shop_Name.toLowerCase().includes(q) ||
                    s.Location.toLowerCase().includes(q) ||
                    s.Contact_Name.toLowerCase().includes(q) ||
                    s.Category.toLowerCase().includes(q)
            );
        }

        return filtered.sort(
            (a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
        );
    }, [salesData, statusFilter, searchQuery]);

    return (
        <div className="history-page">
            {/* Filters */}
            <div className="history-filters glass-card">
                <div className="search-box">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search shops, locations, categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-group">
                    <Filter size={14} />
                    <button
                        className={`filter-btn ${statusFilter === 'All' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('All')}
                    >
                        All ({salesData.length})
                    </button>
                    <button
                        className={`filter-btn confirmed ${statusFilter === 'Confirmed' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('Confirmed')}
                    >
                        Confirmed ({salesData.filter((s) => s.Status === 'Confirmed').length})
                    </button>
                    <button
                        className={`filter-btn rejected ${statusFilter === 'Rejected' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('Rejected')}
                    >
                        Rejected ({salesData.filter((s) => s.Status === 'Rejected').length})
                    </button>
                </div>
            </div>

            {/* Results */}
            {filteredSales.length === 0 ? (
                <EmptyState
                    icon={<ClipboardList size={48} />}
                    title="No Sales Found"
                    description={
                        searchQuery
                            ? 'Try adjusting your search or filter criteria.'
                            : 'Start logging your sales to see them here.'
                    }
                />
            ) : (
                <div className="sales-table-container glass-card">
                    <div className="table-header-row">
                        <span className="result-count">{filteredSales.length} records</span>
                    </div>

                    {/* Mobile: Card view */}
                    <div className="sales-cards-mobile">
                        {filteredSales.map((sale) => (
                            <div key={sale.Sale_ID} className="sale-card-item">
                                <div className="sale-card-top">
                                    <span className="sale-card-shop">{sale.Shop_Name || '—'}</span>
                                    <StatusBadge status={sale.Status} />
                                </div>
                                <div className="sale-card-details">
                                    <span>📍 {sale.Location || '—'}</span>
                                    <span>📞 {sale.Phone || '—'}</span>
                                    <span>📅 {formatDate(sale.Date)}</span>
                                    {sale.Category && <span>📦 {sale.Category}</span>}
                                    {sale.Plan && <span>📋 {sale.Plan}</span>}
                                    {sale.Payment_Method && <span>💳 {sale.Payment_Method}</span>}
                                    {sale.Rejected_Reason && (
                                        <span className="rejection-detail">❌ {sale.Rejected_Reason}</span>
                                    )}
                                </div>
                                <div className="sale-card-footer">
                                    <span className="sale-card-id">{sale.Sale_ID}</span>
                                    <span className="sale-card-time">{formatDateTime(sale.Timestamp)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop: Table view */}
                    <div className="sales-table-desktop">
                        <table className="sales-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Shop</th>
                                    <th>Location</th>
                                    <th>Contact</th>
                                    <th>Phone</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSales.map((sale) => (
                                    <tr key={sale.Sale_ID}>
                                        <td>{formatDate(sale.Date)}</td>
                                        <td className="cell-shop">{sale.Shop_Name || '—'}</td>
                                        <td>{sale.Location || '—'}</td>
                                        <td>{sale.Contact_Name || '—'}</td>
                                        <td>{sale.Phone || '—'}</td>
                                        <td>{sale.Category || '—'}</td>
                                        <td><StatusBadge status={sale.Status} /></td>
                                        <td className="cell-details">
                                            {sale.Status === 'Confirmed' ? (
                                                <span>{sale.Plan} • {sale.Payment_Method}</span>
                                            ) : (
                                                <span className="text-danger-light">{sale.Rejected_Reason}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
