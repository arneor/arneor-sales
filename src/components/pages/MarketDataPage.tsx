'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { EmptyState } from '@/components/ui/SharedComponents';
import { BarChart3, MapPin, Tag, MessageSquare } from 'lucide-react';

interface RejectionInsight {
    reason: string;
    count: number;
    locations: string[];
    categories: string[];
    salesperson: string;
}

export default function MarketDataPage() {
    const { allSalesData } = useApp();

    const rejectedSales = useMemo(
        () => allSalesData.filter((s) => s.Status === 'Rejected'),
        [allSalesData]
    );

    // Aggregate by rejection reason
    const reasonInsights = useMemo(() => {
        const map = new Map<string, RejectionInsight>();
        rejectedSales.forEach((sale) => {
            const reason = sale.Rejected_Reason || 'Unknown';
            const existing = map.get(reason);
            if (existing) {
                existing.count++;
                if (sale.Location && !existing.locations.includes(sale.Location)) {
                    existing.locations.push(sale.Location);
                }
                if (sale.Rejected_Categories) {
                    sale.Rejected_Categories.split(',').map((c) => c.trim()).forEach((cat) => {
                        if (cat && !existing.categories.includes(cat)) {
                            existing.categories.push(cat);
                        }
                    });
                }
            } else {
                map.set(reason, {
                    reason,
                    count: 1,
                    locations: sale.Location ? [sale.Location] : [],
                    categories: sale.Rejected_Categories
                        ? sale.Rejected_Categories.split(',').map((c) => c.trim()).filter(Boolean)
                        : [],
                    salesperson: sale.Salesperson_Name,
                });
            }
        });
        return Array.from(map.values()).sort((a, b) => b.count - a.count);
    }, [rejectedSales]);

    // Aggregate by category
    const categoryBreakdown = useMemo(() => {
        const map = new Map<string, number>();
        rejectedSales.forEach((sale) => {
            if (sale.Rejected_Categories) {
                sale.Rejected_Categories.split(',')
                    .map((c) => c.trim())
                    .filter(Boolean)
                    .forEach((cat) => {
                        map.set(cat, (map.get(cat) || 0) + 1);
                    });
            }
        });
        return Array.from(map.entries())
            .sort(([, a], [, b]) => b - a)
            .map(([category, count]) => ({ category, count }));
    }, [rejectedSales]);

    // Aggregate by location
    const locationBreakdown = useMemo(() => {
        const map = new Map<string, number>();
        rejectedSales.forEach((sale) => {
            const loc = sale.Location || 'Unknown';
            map.set(loc, (map.get(loc) || 0) + 1);
        });
        return Array.from(map.entries())
            .sort(([, a], [, b]) => b - a)
            .map(([location, count]) => ({ location, count }));
    }, [rejectedSales]);

    const maxCategoryCount = Math.max(...categoryBreakdown.map((c) => c.count), 1);
    const maxLocationCount = Math.max(...locationBreakdown.map((l) => l.count), 1);

    if (rejectedSales.length === 0) {
        return (
            <div className="market-page">
                <EmptyState
                    icon={<BarChart3 size={48} />}
                    title="No Market Data Yet"
                    description="Rejection reports will appear here once sales team members start logging rejected sales."
                />
            </div>
        );
    }

    return (
        <div className="market-page">
            {/* Summary Stats */}
            <div className="market-summary">
                <div className="market-stat-card glass-card">
                    <MessageSquare size={20} className="text-danger" />
                    <div>
                        <span className="market-stat-value">{rejectedSales.length}</span>
                        <span className="market-stat-label">Total Rejections</span>
                    </div>
                </div>
                <div className="market-stat-card glass-card">
                    <Tag size={20} className="text-primary" />
                    <div>
                        <span className="market-stat-value">{categoryBreakdown.length}</span>
                        <span className="market-stat-label">Categories Affected</span>
                    </div>
                </div>
                <div className="market-stat-card glass-card">
                    <MapPin size={20} className="text-warning" />
                    <div>
                        <span className="market-stat-value">{locationBreakdown.length}</span>
                        <span className="market-stat-label">Locations</span>
                    </div>
                </div>
            </div>

            <div className="market-grid">
                {/* Category Breakdown */}
                <div className="market-card glass-card">
                    <h3 className="card-title">
                        <Tag size={16} /> Rejections by Product Category
                    </h3>
                    <div className="bar-chart-list">
                        {categoryBreakdown.map((item) => (
                            <div key={item.category} className="bar-chart-item">
                                <div className="bar-label">
                                    <span>{item.category}</span>
                                    <span className="bar-count">{item.count}</span>
                                </div>
                                <div className="bar-track">
                                    <div
                                        className="bar-fill category-bar"
                                        style={{ width: `${(item.count / maxCategoryCount) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Location Breakdown */}
                <div className="market-card glass-card">
                    <h3 className="card-title">
                        <MapPin size={16} /> Rejections by Location
                    </h3>
                    <div className="bar-chart-list">
                        {locationBreakdown.map((item) => (
                            <div key={item.location} className="bar-chart-item">
                                <div className="bar-label">
                                    <span>{item.location}</span>
                                    <span className="bar-count">{item.count}</span>
                                </div>
                                <div className="bar-track">
                                    <div
                                        className="bar-fill location-bar"
                                        style={{ width: `${(item.count / maxLocationCount) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Rejection Reasons */}
            <div className="market-card glass-card full-width-card">
                <h3 className="card-title">
                    <MessageSquare size={16} /> Rejection Reasons (Detailed)
                </h3>
                <div className="reasons-list">
                    {reasonInsights.map((insight, idx) => (
                        <div key={idx} className="reason-item">
                            <div className="reason-header">
                                <span className="reason-text">&ldquo;{insight.reason}&rdquo;</span>
                                <span className="reason-count">{insight.count}x</span>
                            </div>
                            <div className="reason-meta">
                                {insight.locations.length > 0 && (
                                    <span className="reason-locations">
                                        📍 {insight.locations.join(', ')}
                                    </span>
                                )}
                                {insight.categories.length > 0 && (
                                    <div className="reason-categories">
                                        {insight.categories.map((cat) => (
                                            <span key={cat} className="reason-tag">{cat}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
