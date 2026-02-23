'use client';

import React from 'react';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { SALESPERSON_NAV, MANAGER_NAV } from '@/lib/constants';
import {
    LayoutDashboard,
    CheckCircle,
    XCircle,
    ClipboardList,
    BarChart3,
    Target,
    X,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
    LayoutDashboard,
    CheckCircle,
    XCircle,
    ClipboardList,
    BarChart3,
    Target,
};

export default function Sidebar() {
    const { currentPage, setCurrentPage, sidebarOpen, toggleSidebar, currentUser } = useApp();

    const isManager = currentUser?.Role === 'manager';
    const navItems = isManager ? MANAGER_NAV : SALESPERSON_NAV;

    return (
        <>
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={toggleSidebar} />
            )}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="brand-icon" style={{ padding: 0, overflow: 'hidden', background: 'transparent' }}>
                            <Image src="/logo.png" alt="Arneor Logo" width={40} height={40} style={{ objectFit: 'contain' }} />
                        </div>
                        <div className="brand-text">
                            <h2>Arneor Sales</h2>
                            <span>{isManager ? 'Manager Panel' : 'Tracker v1.0'}</span>
                        </div>
                    </div>
                    <button className="sidebar-close" onClick={toggleSidebar}>
                        <X size={20} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => {
                        const Icon = iconMap[item.icon] || LayoutDashboard;
                        const isActive = currentPage === item.id;
                        return (
                            <button
                                key={item.id}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => setCurrentPage(item.id)}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                                {isActive && <div className="nav-indicator" />}
                            </button>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user-badge">
                        <div className="user-avatar-small">
                            {currentUser?.Name?.charAt(0) || '?'}
                        </div>
                        <div className="user-info-small">
                            <span className="user-name-small">{currentUser?.Name}</span>
                            <span className="user-role-small">{currentUser?.Role}</span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
