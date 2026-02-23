'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { MetricCard } from '@/components/ui/SharedComponents';
import { SALES_TEAM, DEFAULT_TARGET } from '@/lib/constants';
import {
    getConversionRate,
    getSalesInPeriod,
    getCurrentPeriod,
    formatDate,
} from '@/lib/utils';
import { Target } from '@/lib/types';
import { Users, CheckCircle, XCircle, TrendingUp, Calendar, Award } from 'lucide-react';

interface PersonStats {
    name: string;
    email: string;
    confirmed: number;
    rejected: number;
    total: number;
    target: number;
    conversion: string;
    progressPct: number;
    lastActivity: string;
}

export default function TeamOverviewPage() {
    const { allSalesData, targets } = useApp();

    const period = getCurrentPeriod();
    const salespersons = SALES_TEAM; // Include managers since they also make sales

    // Build per-person stats
    const teamStats: PersonStats[] = useMemo(() => {
        return salespersons.map((person) => {
            const personSales = allSalesData.filter(
                (s) => s.Salesperson_Email.toLowerCase().trim() === person.email
            );
            const periodSales = getSalesInPeriod(personSales);
            const confirmed = periodSales.filter((s) => s.Status === 'Confirmed').length;
            const rejected = periodSales.filter((s) => s.Status === 'Rejected').length;
            const total = periodSales.length;

            // Find target for this person
            const now = new Date();
            const monthName = now.toLocaleString('en-US', { month: 'long' });
            const personTarget = targets.find(
                (t: Target) =>
                    t.Salesperson_Email.toLowerCase().trim() === person.email &&
                    t.Month === monthName &&
                    t.Year === now.getFullYear()
            );
            const target = personTarget?.Target_Count || DEFAULT_TARGET;

            const conversion = total > 0 ? ((confirmed / total) * 100).toFixed(0) : '0';
            const progressPct = target > 0 ? Math.min(Math.round((confirmed / target) * 100), 100) : 0;

            const sortedSales = [...personSales].sort(
                (a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
            );
            const lastActivity = sortedSales.length > 0 ? formatDate(sortedSales[0].Date) : 'No activity';

            return {
                name: person.name,
                email: person.email,
                confirmed,
                rejected,
                total,
                target,
                conversion,
                progressPct,
                lastActivity,
            };
        });
    }, [allSalesData, salespersons, targets]);

    // Aggregates
    const totalConfirmed = teamStats.reduce((sum, p) => sum + p.confirmed, 0);
    const totalRejected = teamStats.reduce((sum, p) => sum + p.rejected, 0);
    const totalVisits = teamStats.reduce((sum, p) => sum + p.total, 0);
    const teamConversion = getConversionRate(totalConfirmed, totalVisits);

    // Top performer (only if someone has sales)
    const sorted = [...teamStats].sort((a, b) => b.confirmed - a.confirmed);
    const topPerformer = sorted[0]?.confirmed > 0 ? sorted[0] : null;

    return (
        <div className="team-overview-page">
            <div className="welcome-section">
                <h2>Team Overview 📊</h2>
                <p className="period-label">
                    <Calendar size={14} /> Active Period: {period.label}
                </p>
            </div>

            {/* Team Totals */}
            <div className="metrics-grid">
                <MetricCard
                    label="Team Confirmed"
                    value={totalConfirmed}
                    icon={<CheckCircle size={20} />}
                    color="#10b981"
                    subtitle={`${salespersons.length} salespeople`}
                />
                <MetricCard
                    label="Team Rejected"
                    value={totalRejected}
                    icon={<XCircle size={20} />}
                    color="#ef4444"
                    subtitle={`${totalVisits} total visits`}
                />
                <MetricCard
                    label="Team Conversion"
                    value={`${teamConversion}%`}
                    icon={<TrendingUp size={20} />}
                    color="#6366f1"
                />
                <MetricCard
                    label="Top Performer"
                    value={topPerformer?.name?.split(' ')[0] || 'No data yet'}
                    icon={<Award size={20} />}
                    color="#f59e0b"
                    subtitle={topPerformer ? `${topPerformer.confirmed} confirmed` : 'Waiting for sales'}
                />
            </div>

            {/* Leaderboard */}
            <div className="glass-card">
                <h3 className="card-title">
                    <Users size={16} /> Salesperson Leaderboard
                </h3>

                <div className="leaderboard-list">
                    {teamStats
                        .sort((a, b) => b.confirmed - a.confirmed)
                        .map((person, idx) => (
                            <div key={person.email} className="leaderboard-item">
                                <div className="leaderboard-rank">
                                    <span className={`rank-number ${idx < 3 ? `rank-${idx + 1}` : ''}`}>
                                        {idx + 1}
                                    </span>
                                </div>

                                <div className="leaderboard-info">
                                    <div className="leaderboard-name">{person.name}</div>
                                    <div className="leaderboard-meta">
                                        Last active: {person.lastActivity}
                                    </div>
                                </div>

                                <div className="leaderboard-stats">
                                    <div className="lb-stat">
                                        <span className="lb-stat-value text-success">{person.confirmed}</span>
                                        <span className="lb-stat-label">Confirmed</span>
                                    </div>
                                    <div className="lb-stat">
                                        <span className="lb-stat-value text-danger">{person.rejected}</span>
                                        <span className="lb-stat-label">Rejected</span>
                                    </div>
                                    <div className="lb-stat">
                                        <span className="lb-stat-value">{person.conversion}%</span>
                                        <span className="lb-stat-label">Conv.</span>
                                    </div>
                                </div>

                                <div className="leaderboard-progress">
                                    <div className="lb-progress-bar">
                                        <div
                                            className="lb-progress-fill"
                                            style={{
                                                width: `${person.progressPct}%`,
                                                background:
                                                    person.progressPct >= 100
                                                        ? 'var(--success)'
                                                        : person.progressPct >= 50
                                                            ? 'var(--accent-primary)'
                                                            : 'var(--danger)',
                                            }}
                                        />
                                    </div>
                                    <span className="lb-progress-text">
                                        {person.confirmed}/{person.target}
                                    </span>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}
