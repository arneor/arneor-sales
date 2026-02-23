'use client';

import React from 'react';

// ============ Loading Spinner ============

export function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
    return (
        <div className="loading-spinner-container">
            <div className="loading-spinner" />
            <p className="loading-text">{text}</p>
        </div>
    );
}

// ============ Metric Card ============

interface MetricCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    subtitle?: string;
    color?: string;
}

export function MetricCard({ label, value, icon, trend, subtitle, color }: MetricCardProps) {
    return (
        <div className="metric-card" style={color ? { borderColor: color } : undefined}>
            <div className="metric-header">
                <span className="metric-label">{label}</span>
                <div className="metric-icon" style={color ? { color } : undefined}>
                    {icon}
                </div>
            </div>
            <div className="metric-value">{value}</div>
            {subtitle && (
                <div className={`metric-subtitle ${trend || ''}`}>
                    {trend === 'up' && '↑ '}
                    {trend === 'down' && '↓ '}
                    {subtitle}
                </div>
            )}
        </div>
    );
}

// ============ Progress Gauge (SVG Circle) ============

interface ProgressGaugeProps {
    current: number;
    target: number;
    label?: string;
    size?: number;
    strokeWidth?: number;
}

export function ProgressGauge({
    current,
    target,
    label = 'Target Progress',
    size = 200,
    strokeWidth = 12,
}: ProgressGaugeProps) {
    const percentage = target > 0 ? Math.min(100, (current / target) * 100) : 0;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const isComplete = current >= target;
    const colorClass = isComplete ? 'gauge-complete' : percentage >= 50 ? 'gauge-progress' : 'gauge-behind';

    return (
        <div className="progress-gauge">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Background circle */}
                <circle
                    className="gauge-bg"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                />
                {/* Progress arc */}
                <circle
                    className={`gauge-fill ${colorClass}`}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
                {/* Center text */}
                <text x={size / 2} y={size / 2 - 10} className="gauge-value" textAnchor="middle" dominantBaseline="middle">
                    {current}/{target}
                </text>
                <text x={size / 2} y={size / 2 + 16} className="gauge-label-text" textAnchor="middle" dominantBaseline="middle">
                    {Math.round(percentage)}%
                </text>
            </svg>
            <p className="gauge-label">{label}</p>
        </div>
    );
}

// ============ Alert Container ============

export function AlertContainer({ alerts, onDismiss }: { alerts: { id: string; type: string; message: string }[]; onDismiss: (id: string) => void }) {
    if (alerts.length === 0) return null;

    return (
        <div className="alert-container">
            {alerts.map((alert) => (
                <div key={alert.id} className={`alert alert-${alert.type}`}>
                    <span>{alert.message}</span>
                    <button className="alert-dismiss" onClick={() => onDismiss(alert.id)}>×</button>
                </div>
            ))}
        </div>
    );
}

// ============ Multi-Select Chips ============

interface MultiSelectProps {
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    label: string;
}

export function MultiSelectChips({ options, selected, onChange, label }: MultiSelectProps) {
    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter((s) => s !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    return (
        <div className="multi-select">
            <label className="form-label">{label}</label>
            <div className="chips-container">
                {options.map((option) => (
                    <button
                        key={option}
                        type="button"
                        className={`chip ${selected.includes(option) ? 'chip-active' : ''}`}
                        onClick={() => toggleOption(option)}
                    >
                        {option}
                        {selected.includes(option) && <span className="chip-check">✓</span>}
                    </button>
                ))}
            </div>
            {selected.length > 0 && (
                <div className="selected-count">{selected.length} selected</div>
            )}
        </div>
    );
}

// ============ Status Badge ============

export function StatusBadge({ status }: { status: 'Confirmed' | 'Rejected' }) {
    return (
        <span className={`status-badge ${status.toLowerCase()}`}>
            {status}
        </span>
    );
}

// ============ Empty State ============

export function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="empty-state">
            <div className="empty-icon">{icon}</div>
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    );
}
