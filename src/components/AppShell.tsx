'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { AlertContainer, LoadingSpinner } from '@/components/ui/SharedComponents';
import LoginPage from '@/components/pages/LoginPage';
import DashboardPage from '@/components/pages/DashboardPage';
import ConfirmedSalePage from '@/components/pages/ConfirmedSalePage';
import RejectedSalePage from '@/components/pages/RejectedSalePage';
import SalesHistoryPage from '@/components/pages/SalesHistoryPage';
import MarketDataPage from '@/components/pages/MarketDataPage';
import TeamOverviewPage from '@/components/pages/TeamOverviewPage';
import SetTargetsPage from '@/components/pages/SetTargetsPage';
import AllHistoryPage from '@/components/pages/AllHistoryPage';

const pageComponents: Record<string, React.ComponentType> = {
    dashboard: DashboardPage,
    'confirmed-sale': ConfirmedSalePage,
    'rejected-sale': RejectedSalePage,
    history: SalesHistoryPage,
    'market-data': MarketDataPage,
    'team-overview': TeamOverviewPage,
    'set-targets': SetTargetsPage,
    'all-history': AllHistoryPage,
};

export default function AppShell() {
    const { isLoggedIn, isLoading, currentPage, sidebarOpen, alerts, dismissAlert, currentUser } = useApp();

    if (!isLoggedIn) {
        if (isLoading) {
            return (
                <div className="app-loading">
                    <LoadingSpinner text="Initializing Arneor Sales Tracker..." />
                </div>
            );
        }
        return <LoginPage />;
    }

    if (isLoading) {
        return (
            <div className="app-loading">
                <LoadingSpinner text="Loading sales data..." />
            </div>
        );
    }

    const isManager = currentUser?.Role === 'manager';
    const defaultPage = isManager ? 'team-overview' : 'dashboard';
    const PageComponent = pageComponents[currentPage] || pageComponents[defaultPage];

    return (
        <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            <Sidebar />
            <div className="main-content">
                <Header />
                <main className="main-area">
                    <div className="main-scroll">
                        <PageComponent />
                    </div>
                </main>
            </div>
            <AlertContainer alerts={alerts} onDismiss={dismissAlert} />
        </div>
    );
}
