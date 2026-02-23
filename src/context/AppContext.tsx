'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { SalesUser, SaleEntry, Target, PageId, Alert } from '@/lib/types';
import {
    loadGapiScript,
    loadGisScript,
    initTokenClient,
    requestAccessToken,
    revokeToken,
    initializeSheets,
    fetchAllData,
    getUserEmail,
    findCurrentUser,
    clearCache,
} from '@/lib/google-sheets';

interface AppState {
    isLoggedIn: boolean;
    isLoading: boolean;
    authError: string | null;
    currentUser: SalesUser | null;
    userEmail: string;
    salesData: SaleEntry[];
    allSalesData: SaleEntry[];
    targets: Target[];
    currentPage: PageId;
    sidebarOpen: boolean;
    alerts: Alert[];
    lastSync: Date | null;
    isSyncing: boolean;
}

interface AppContextType extends AppState {
    login: () => void;
    logout: () => void;
    refreshData: () => Promise<void>;
    setCurrentPage: (page: PageId) => void;
    toggleSidebar: () => void;
    addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void;
    dismissAlert: (id: string) => void;
    setSalesData: (data: SaleEntry[]) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp(): AppContextType {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be inside AppProvider');
    return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AppState>({
        isLoggedIn: false,
        isLoading: true,
        authError: null,
        currentUser: null,
        userEmail: '',
        salesData: [],
        allSalesData: [],
        targets: [],
        currentPage: 'dashboard',
        sidebarOpen: true,
        alerts: [],
        lastSync: null,
        isSyncing: false,
    });

    const initRef = useRef(false);

    const addAlert = useCallback((alert: Omit<Alert, 'id' | 'timestamp'>) => {
        const newAlert: Alert = {
            ...alert,
            id: crypto.randomUUID(),
            timestamp: new Date(),
        };
        setState((s) => ({ ...s, alerts: [...s.alerts, newAlert] }));
        setTimeout(() => {
            setState((s) => ({
                ...s,
                alerts: s.alerts.filter((a) => a.id !== newAlert.id),
            }));
        }, 5000);
    }, []);

    const loadData = useCallback(async (email: string) => {
        try {
            setState((s) => ({ ...s, isSyncing: true }));

            await initializeSheets();

            const user = await findCurrentUser(email);
            if (!user) {
                setState((s) => ({
                    ...s,
                    isLoggedIn: false,
                    isLoading: false,
                    isSyncing: false,
                    authError: `Access denied. "${email}" is not a registered sales team member. Contact your administrator.`,
                }));
                revokeToken();
                return;
            }

            const data = await fetchAllData(email);

            setState((s) => ({
                ...s,
                isLoggedIn: true,
                isLoading: false,
                currentUser: user,
                userEmail: email,
                salesData: data.salesData,
                allSalesData: data.allSalesData,
                targets: data.targets,
                currentPage: user.Role === 'manager' ? 'team-overview' : 'dashboard',
                lastSync: new Date(),
                isSyncing: false,
                authError: null,
            }));
        } catch (err) {
            console.error('Error loading data:', err);
            setState((s) => ({
                ...s,
                isLoading: false,
                isSyncing: false,
                authError: 'Failed to load data. Please try again.',
            }));
        }
    }, []);

    const handleAuthSuccess = useCallback(async () => {
        try {
            setState((s) => ({ ...s, isLoading: true, authError: null }));
            const email = await getUserEmail();
            await loadData(email);
        } catch (err) {
            console.error('Auth success handler error:', err);
            setState((s) => ({
                ...s,
                isLoading: false,
                authError: 'Authentication failed. Please try again.',
            }));
        }
    }, [loadData]);

    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;

        const init = async () => {
            try {
                await loadGapiScript();
                await loadGisScript();
                initTokenClient(
                    handleAuthSuccess,
                    (err) => {
                        console.error('Auth error:', err);
                        setState((s) => ({
                            ...s,
                            isLoading: false,
                            authError: err?.error_description || 'Authentication failed',
                        }));
                    }
                );
                // If token was restored and onSuccess was called, isLoading will be managed there.
                // Otherwise, show login page.
                setTimeout(() => {
                    setState((s) => {
                        if (s.isLoading && !s.isLoggedIn) {
                            return { ...s, isLoading: false };
                        }
                        return s;
                    });
                }, 2000);
            } catch (err) {
                console.error('Init error:', err);
                setState((s) => ({
                    ...s,
                    isLoading: false,
                    authError: 'Failed to initialize. Check your internet connection.',
                }));
            }
        };

        init();
    }, [handleAuthSuccess]);

    const login = useCallback(() => {
        setState((s) => ({ ...s, isLoading: true, authError: null }));
        try {
            requestAccessToken();
        } catch (err) {
            console.error('Login error:', err);
            setState((s) => ({
                ...s,
                isLoading: false,
                authError: 'Login failed. Please try again.',
            }));
        }
    }, []);

    const logout = useCallback(() => {
        revokeToken();
        clearCache();
        setState({
            isLoggedIn: false,
            isLoading: false,
            authError: null,
            currentUser: null,
            userEmail: '',
            salesData: [],
            allSalesData: [],
            targets: [],
            currentPage: 'dashboard',
            sidebarOpen: true,
            alerts: [],
            lastSync: null,
            isSyncing: false,
        });
    }, []);

    const refreshData = useCallback(async () => {
        if (!state.userEmail) return;
        addAlert({ type: 'info', message: 'Syncing data...' });
        await loadData(state.userEmail);
        addAlert({ type: 'success', message: 'Data synced successfully' });
    }, [state.userEmail, loadData, addAlert]);

    const contextValue: AppContextType = {
        ...state,
        login,
        logout,
        refreshData,
        setCurrentPage: (page: PageId) => setState((s) => ({ ...s, currentPage: page, sidebarOpen: false })),
        toggleSidebar: () => setState((s) => ({ ...s, sidebarOpen: !s.sidebarOpen })),
        addAlert,
        dismissAlert: (id: string) => setState((s) => ({ ...s, alerts: s.alerts.filter((a) => a.id !== id) })),
        setSalesData: (data: SaleEntry[]) => setState((s) => ({ ...s, salesData: data })),
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
}
