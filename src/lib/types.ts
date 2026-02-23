export interface SalesUser {
    Email: string;
    Name: string;
    Role: 'salesperson' | 'manager';
}

export interface SaleEntry {
    Sale_ID: string;
    Date: string;
    Salesperson_Email: string;
    Salesperson_Name: string;
    Status: 'Confirmed' | 'Rejected';
    Shop_Name: string;
    Location: string;
    Phone: string;
    Contact_Name: string;
    Category: string;
    Plan: string;
    Payment_Method: string;
    Rejected_Reason: string;
    Rejected_Categories: string; // comma-separated multi-select
    Timestamp: string;
}

export interface Target {
    Salesperson_Email: string;
    Month: string;
    Year: number;
    Target_Count: number;
}

export type PageId =
    | 'dashboard'
    | 'confirmed-sale'
    | 'rejected-sale'
    | 'history'
    | 'market-data'
    | 'team-overview'
    | 'set-targets'
    | 'all-history';

export interface Alert {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    timestamp: Date;
}

export interface NavItem {
    id: PageId;
    label: string;
    icon: string;
    managerOnly?: boolean;
}
