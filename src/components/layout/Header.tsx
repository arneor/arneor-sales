'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Menu, RefreshCw, LogOut, Wifi, WifiOff } from 'lucide-react';

export default function Header() {
    const {
        currentPage,
        toggleSidebar,
        refreshData,
        logout,
        isSyncing,
        lastSync,
        currentUser,
    } = useApp();

    const pageLabels: Record<string, string> = {
        dashboard: 'Dashboard',
        'confirmed-sale': 'New Confirmed Sale',
        'rejected-sale': 'New Rejected Sale',
        history: 'Sales History',
        'market-data': 'Market Intelligence',
    };

    return (
        <header className="app-header">
            <div className="header-left">
                <button className="hamburger" onClick={toggleSidebar}>
                    <Menu size={22} />
                </button>
                <div className="page-title-section">
                    <h1 className="page-title">{pageLabels[currentPage] || 'Dashboard'}</h1>
                </div>
            </div>

            <div className="header-right">
                <div className="sync-indicator">
                    {isSyncing ? (
                        <WifiOff size={14} className="sync-icon spinning" />
                    ) : (
                        <Wifi size={14} className="sync-icon connected" />
                    )}
                    <span className="sync-text">
                        {isSyncing
                            ? 'Syncing...'
                            : lastSync
                                ? `Synced ${lastSync.toLocaleTimeString()}`
                                : 'Ready'}
                    </span>
                </div>

                <button
                    className="header-btn"
                    onClick={refreshData}
                    disabled={isSyncing}
                    title="Refresh Data"
                >
                    <RefreshCw size={16} className={isSyncing ? 'spinning' : ''} />
                </button>

                <div className="header-user">
                    <div className="header-user-avatar">
                        {currentUser?.Name?.charAt(0) || '?'}
                    </div>
                    <span className="header-user-name">{currentUser?.Name}</span>
                </div>

                <button className="header-btn logout-btn" onClick={logout} title="Sign Out">
                    <LogOut size={16} />
                </button>
            </div>
        </header>
    );
}
