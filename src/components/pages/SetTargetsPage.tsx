'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { SALES_TEAM, DEFAULT_TARGET } from '@/lib/constants';
import { setTarget, fetchAllTargets, clearCache } from '@/lib/google-sheets';
import { Target as TargetIcon, Save, Check } from 'lucide-react';

export default function SetTargetsPage() {
    const { addAlert, refreshData } = useApp();

    const salespersons = SALES_TEAM; // Include managers since they also make sales

    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.toLocaleString('en-US', { month: 'long' }));
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [targetValues, setTargetValues] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState<Record<string, boolean>>({});
    const [saved, setSaved] = useState<Record<string, boolean>>({});
    const [loadingTargets, setLoadingTargets] = useState(true);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];

    // Load existing targets for selected month/year
    const loadTargets = useCallback(async () => {
        setLoadingTargets(true);
        try {
            clearCache();
            const allTargets = await fetchAllTargets();
            const values: Record<string, number> = {};
            salespersons.forEach((p) => {
                const existing = allTargets.find(
                    (t) =>
                        t.Salesperson_Email.toLowerCase().trim() === p.email &&
                        t.Month === selectedMonth &&
                        t.Year === selectedYear
                );
                values[p.email] = existing?.Target_Count || DEFAULT_TARGET;
            });
            setTargetValues(values);
            setSaved({});
        } catch {
            addAlert({ type: 'error', message: 'Failed to load targets' });
        } finally {
            setLoadingTargets(false);
        }
    }, [selectedMonth, selectedYear, salespersons, addAlert]);

    useEffect(() => {
        loadTargets();
    }, [loadTargets]);

    const handleSave = async (email: string) => {
        setSaving((s) => ({ ...s, [email]: true }));
        try {
            await setTarget(email, selectedMonth, selectedYear, targetValues[email] || DEFAULT_TARGET);
            setSaved((s) => ({ ...s, [email]: true }));
            await refreshData();
            addAlert({ type: 'success', message: `Target updated for ${salespersons.find((p) => p.email === email)?.name}` });
        } catch {
            addAlert({ type: 'error', message: 'Failed to save target. Try again.' });
        } finally {
            setSaving((s) => ({ ...s, [email]: false }));
        }
    };

    const handleSaveAll = async () => {
        for (const person of salespersons) {
            await handleSave(person.email);
        }
        addAlert({ type: 'success', message: 'All targets saved!' });
    };

    return (
        <div className="set-targets-page">
            <div className="welcome-section">
                <h2>Set Monthly Targets 🎯</h2>
                <p className="period-label">
                    Set confirmed sale targets for each salesperson
                </p>
            </div>

            {/* Month/Year Selector */}
            <div className="glass-card">
                <div className="target-period-selector">
                    <div className="form-group">
                        <label className="form-label">Month</label>
                        <select
                            className="form-input"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                            {months.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Year</label>
                        <select
                            className="form-input"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        >
                            {[2025, 2026, 2027].map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={handleSaveAll} style={{ alignSelf: 'flex-end' }}>
                        <Save size={16} />
                        Save All
                    </button>
                </div>
            </div>

            {/* Targets Table */}
            <div className="glass-card">
                <h3 className="card-title">
                    <TargetIcon size={16} /> {selectedMonth} {selectedYear} Targets
                </h3>

                {loadingTargets ? (
                    <div className="empty-activity">Loading targets...</div>
                ) : (
                    <div className="targets-list">
                        {salespersons.map((person) => (
                            <div key={person.email} className="target-row">
                                <div className="target-person">
                                    <div className="user-avatar-small">
                                        {person.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="target-person-name">{person.name}</div>
                                        <div className="target-person-email">{person.email}</div>
                                    </div>
                                </div>

                                <div className="target-input-group">
                                    <label className="form-label">Target (confirmed sales)</label>
                                    <input
                                        type="number"
                                        className="form-input target-input"
                                        min={0}
                                        max={999}
                                        value={targetValues[person.email] || DEFAULT_TARGET}
                                        onChange={(e) => {
                                            setTargetValues((v) => ({
                                                ...v,
                                                [person.email]: parseInt(e.target.value) || 0,
                                            }));
                                            setSaved((s) => ({ ...s, [person.email]: false }));
                                        }}
                                    />
                                </div>

                                <button
                                    className={`btn ${saved[person.email] ? 'btn-saved' : 'btn-primary'} btn-save-target`}
                                    onClick={() => handleSave(person.email)}
                                    disabled={saving[person.email] || saved[person.email]}
                                >
                                    {saving[person.email] ? (
                                        'Saving...'
                                    ) : saved[person.email] ? (
                                        <><Check size={14} /> Saved</>
                                    ) : (
                                        <><Save size={14} /> Save</>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
