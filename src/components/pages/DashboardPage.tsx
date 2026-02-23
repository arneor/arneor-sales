'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { ProgressGauge, MetricCard } from '@/components/ui/SharedComponents';
import {
    getCurrentPeriod,
    getCurrentTarget,
    getConfirmedCount,
    getRejectedCount,
    getSalesInPeriod,
    calculateDailyPace,
    getProgressPercentage,
    getTimelineProgress,
    getConversionRate,
    formatDateTime,
} from '@/lib/utils';
import { CheckCircle, XCircle, TrendingUp, Clock, Calendar, Zap } from 'lucide-react';

export default function DashboardPage() {
    const { salesData, targets, currentUser } = useApp();

    const period = getCurrentPeriod();
    const targetCount = getCurrentTarget(targets);
    const confirmedCount = getConfirmedCount(salesData);
    const rejectedCount = getRejectedCount(salesData);
    const totalInPeriod = getSalesInPeriod(salesData).length;
    const pace = calculateDailyPace(confirmedCount, targetCount);
    const progressPct = getProgressPercentage(confirmedCount, targetCount);
    const timelinePct = getTimelineProgress();
    const conversionRate = getConversionRate(confirmedCount, totalInPeriod);

    const recentSales = [...salesData]
        .sort((a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime())
        .slice(0, 5);

    return (
        <div className="dashboard-page">
            {/* Welcome Section */}
            <div className="welcome-section">
                <h2>Welcome back, {currentUser?.Name?.split(' ')[0]} 👋</h2>
                <p className="period-label">
                    <Calendar size={14} /> Active Period: {period.label}
                </p>
            </div>

            {/* Top Metrics Row */}
            <div className="metrics-grid">
                <MetricCard
                    label="Confirmed Sales"
                    value={confirmedCount}
                    icon={<CheckCircle size={20} />}
                    color="#10b981"
                    subtitle={`of ${targetCount} target`}
                    trend={pace.isOnTrack ? 'up' : 'down'}
                />
                <MetricCard
                    label="Rejected Sales"
                    value={rejectedCount}
                    icon={<XCircle size={20} />}
                    color="#ef4444"
                    subtitle={`${totalInPeriod} total visits`}
                />
                <MetricCard
                    label="Conversion Rate"
                    value={`${conversionRate}%`}
                    icon={<TrendingUp size={20} />}
                    color="#6366f1"
                    subtitle={totalInPeriod > 0 ? `${confirmedCount} of ${totalInPeriod}` : 'No data yet'}
                />
                <MetricCard
                    label="Days Remaining"
                    value={pace.daysRemaining}
                    icon={<Clock size={20} />}
                    color="#f59e0b"
                    subtitle={`${pace.required.toFixed(1)}/day needed`}
                    trend={pace.isOnTrack ? 'up' : 'down'}
                />
            </div>

            {/* Progress & Timeline Section */}
            <div className="progress-section">
                <div className="gauge-card glass-card">
                    <h3 className="card-title">Target Progress</h3>
                    <ProgressGauge current={confirmedCount} target={targetCount} />
                    <div className="pace-indicator">
                        <Zap size={16} className={pace.isOnTrack ? 'text-success' : 'text-danger'} />
                        <span className={pace.isOnTrack ? 'text-success' : 'text-danger'}>
                            {pace.isOnTrack ? 'On Track' : 'Behind Pace'}
                        </span>
                        <span className="pace-detail">
                            Expected: {pace.expectedCount} | Actual: {confirmedCount}
                        </span>
                    </div>
                </div>

                <div className="timeline-card glass-card">
                    <h3 className="card-title">Period Timeline</h3>
                    <div className="timeline-bar-container">
                        <div className="timeline-bar">
                            <div
                                className="timeline-progress"
                                style={{ width: `${timelinePct}%` }}
                            />
                            <div
                                className="timeline-target-marker"
                                style={{ left: `${progressPct}%` }}
                                title={`Sales Progress: ${progressPct}%`}
                            />
                        </div>
                        <div className="timeline-labels">
                            <span>{period.label.split('–')[0].trim()}</span>
                            <span className="timeline-today">Today ({timelinePct}%)</span>
                            <span>{period.label.split('–')[1]?.trim()}</span>
                        </div>
                    </div>

                    <div className="timeline-stats">
                        <div className="timeline-stat">
                            <span className="stat-label">Time Elapsed</span>
                            <span className="stat-value">{timelinePct}%</span>
                        </div>
                        <div className="timeline-stat">
                            <span className="stat-label">Target Completed</span>
                            <span className="stat-value">{progressPct}%</span>
                        </div>
                        <div className="timeline-stat">
                            <span className="stat-label">Efficiency</span>
                            <span className={`stat-value ${progressPct >= timelinePct ? 'text-success' : 'text-danger'}`}>
                                {timelinePct > 0 ? Math.round((progressPct / timelinePct) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity glass-card">
                <h3 className="card-title">Recent Activity</h3>
                {recentSales.length === 0 ? (
                    <div className="empty-activity">
                        <p>No sales recorded yet in this period. Start by logging your first sale!</p>
                    </div>
                ) : (
                    <div className="activity-list">
                        {recentSales.map((sale) => (
                            <div key={sale.Sale_ID} className="activity-item">
                                <div className={`activity-dot ${sale.Status.toLowerCase()}`} />
                                <div className="activity-content">
                                    <div className="activity-header">
                                        <span className="activity-shop">{sale.Shop_Name || 'Unknown Shop'}</span>
                                        <span className={`activity-status ${sale.Status.toLowerCase()}`}>
                                            {sale.Status}
                                        </span>
                                    </div>
                                    <div className="activity-meta">
                                        <span>{sale.Location}</span>
                                        {sale.Category && <span>• {sale.Category}</span>}
                                        <span>• {formatDateTime(sale.Timestamp)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
