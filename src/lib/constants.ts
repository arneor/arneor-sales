import { NavItem } from './types';

export const SPREADSHEET_ID = process.env.NEXT_PUBLIC_SPREADSHEET_ID || '';

export const COMPANY_INFO = {
    name: 'Arneor Labs',
    website: 'https://www.arneor.com',
    toolName: 'Arneor Sales Tracker',
    shortName: 'Sales',
};

export const SHEETS = {
    USERS: 'Users',
    SALES_DATA: 'Sales_Data',
    TARGETS: 'Targets',
};

// Authorized sales team — only these emails can access the app
export const SALES_TEAM: { email: string; name: string; role: 'salesperson' | 'manager' }[] = [
    { email: 'abijithabix76@gmail.com', name: 'Abijith T', role: 'salesperson' },
    { email: 'anandsagarps7736@gmail.com', name: 'Anand Sagar Ps', role: 'salesperson' },
    { email: 'sinankpmk61@gmail.com', name: 'Muhammed Sinan K', role: 'salesperson' },
    { email: 'vighneshk32@gmail.com', name: 'Vignesh K', role: 'salesperson' },
    { email: 'ajinaju92@gmail.com', name: 'Ajin K', role: 'salesperson' },
    { email: 'abhishekabhishekc7@gmail.com', name: 'Abhishek C', role: 'salesperson' },
    { email: 'amjunaidd@gmail.com', name: 'Muhammed Junaid A', role: 'salesperson' },
    { email: 'lalnidhinp02@gmail.com', name: 'Nidhin', role: 'salesperson' },
    { email: 'vahabferoke9@gmail.com', name: 'Vahab Feroke', role: 'salesperson' },
    { email: 'infovahabkp@gmail.com', name: 'Vahab KP', role: 'manager' },
    { email: 'infonidhinlal@gmail.com', name: 'Nidhin Lal', role: 'manager' },
];

export const PRODUCT_CATEGORIES = [
    'BeetLink',
    'Wifi Marketing',
];

export const PRODUCT_PLANS: Record<string, string[]> = {
    'BeetLink': ['₹299'],
    'Wifi Marketing': ['₹699', '₹999'],
};

export const PLANS = [
    '₹299',
    '₹699',
    '₹999',
];

export const PAYMENT_METHODS = [
    'UPI',
    'Bank Transfer',
    'Cash',
    'Cheque',
    'Card',
    'Other',
];

// Navigation for salespeople
export const SALESPERSON_NAV: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { id: 'confirmed-sale', label: 'New Confirmed Sale', icon: 'CheckCircle' },
    { id: 'rejected-sale', label: 'New Rejected Sale', icon: 'XCircle' },
    { id: 'history', label: 'My Sales History', icon: 'ClipboardList' },
];

// Navigation for managers
export const MANAGER_NAV: NavItem[] = [
    { id: 'team-overview', label: 'Team Overview', icon: 'LayoutDashboard' },
    { id: 'confirmed-sale', label: 'New Confirmed Sale', icon: 'CheckCircle' },
    { id: 'rejected-sale', label: 'New Rejected Sale', icon: 'XCircle' },
    { id: 'set-targets', label: 'Set Targets', icon: 'Target' },
    { id: 'all-history', label: 'All Sales History', icon: 'ClipboardList' },
    { id: 'market-data', label: 'Market Data', icon: 'BarChart3' },
];

// Combined for backward compat
export const NAV_ITEMS: NavItem[] = [...SALESPERSON_NAV, ...MANAGER_NAV];

export const CHART_COLORS = {
    primary: '#6366f1',
    primaryLight: '#818cf8',
    success: '#10b981',
    successLight: '#34d399',
    danger: '#ef4444',
    dangerLight: '#f87171',
    warning: '#f59e0b',
    warningLight: '#fbbf24',
    info: '#3b82f6',
    infoLight: '#60a5fa',
    purple: '#8b5cf6',
    pink: '#ec4899',
    teal: '#14b8a6',
    orange: '#f97316',
};

export const CHART_PALETTE = [
    CHART_COLORS.primary,
    CHART_COLORS.success,
    CHART_COLORS.danger,
    CHART_COLORS.warning,
    CHART_COLORS.info,
    CHART_COLORS.purple,
    CHART_COLORS.pink,
    CHART_COLORS.teal,
    CHART_COLORS.orange,
];

export const DEFAULT_TARGET = 15;

// Period: Feb 23 – March 23
export const PERIOD_START_DAY = 23;
export const PERIOD_START_MONTH = 1; // 0-indexed: February
export const PERIOD_END_DAY = 23;
export const PERIOD_END_MONTH = 2; // 0-indexed: March
