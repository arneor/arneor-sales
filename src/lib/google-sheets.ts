/* eslint-disable @typescript-eslint/no-explicit-any */
import { SalesUser, SaleEntry, Target } from './types';
import { SPREADSHEET_ID, SHEETS, SALES_TEAM } from './constants';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email';

let gapiLoaded = false;
let gisLoaded = false;
let tokenClient: any = null;

// ============ Cache System ============

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 30000;

function getCached<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
        cache.delete(key);
        return null;
    }
    return entry.data as T;
}

function setCache<T>(key: string, data: T, ttl = CACHE_TTL): void {
    cache.set(key, { data, timestamp: Date.now(), ttl });
}

export function clearCache(): void {
    cache.clear();
}

// ============ Retry Logic ============

async function withRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            if (i === retries - 1) throw error;
            if (error?.status === 429) {
                await new Promise((r) => setTimeout(r, delay * (i + 1) * 2));
            } else {
                await new Promise((r) => setTimeout(r, delay * (i + 1)));
            }
        }
    }
    throw new Error('Max retries reached');
}

// ============ Init & Auth ============

export function loadGapiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (gapiLoaded) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';

        script.onload = () => {
            if (!(window as any).gapi) {
                reject(new Error('Google API Script loaded but window.gapi is undefined'));
                return;
            }
            (window as any).gapi.load('client', async () => {
                try {
                    await (window as any).gapi.client.init({
                        discoveryDocs: [
                            'https://sheets.googleapis.com/$discovery/rest?version=v4',
                        ],
                    });
                    gapiLoaded = true;
                    resolve();
                } catch (err: any) {
                    console.error('GAPI init error:', err);
                    reject(new Error(`GAPI init failed: ${err?.message || JSON.stringify(err)}`));
                }
            });
        };

        script.onerror = () => reject(new Error('Failed to load Google API script'));
        document.head.appendChild(script);
    });
}

export function loadGisScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (gisLoaded) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
            if (!(window as any).google) {
                reject(new Error('Google Identity Script loaded but window.google is undefined'));
                return;
            }
            gisLoaded = true;
            resolve();
        };
        script.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
        document.head.appendChild(script);
    });
}

export function initTokenClient(
    onSuccess: () => void,
    onError: (err: any) => void
): void {
    const gapi = (window as any).gapi;
    tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
            if (response.error) {
                onError(response);
                return;
            }
            if (response.access_token) {
                const tokenData = {
                    access_token: response.access_token,
                    expires_in: parseInt(response.expires_in),
                    timestamp: Date.now(),
                };
                localStorage.setItem('sales_gapi_token', JSON.stringify(tokenData));
                gapi.client.setToken(response);
            }
            onSuccess();
        },
    });

    // Try to restore token
    const savedToken = localStorage.getItem('sales_gapi_token');
    if (savedToken) {
        try {
            const tokenData = JSON.parse(savedToken);
            const now = Date.now();
            if (now - tokenData.timestamp < tokenData.expires_in * 1000 - 60000) {
                gapi.client.setToken({ access_token: tokenData.access_token });
                if (gapiLoaded) onSuccess();
            } else {
                localStorage.removeItem('sales_gapi_token');
            }
        } catch (e) {
            console.error('Error restoring token', e);
            localStorage.removeItem('sales_gapi_token');
        }
    }
}

export function requestAccessToken(): void {
    if (!tokenClient) {
        throw new Error('Token client not initialized');
    }
    const gapi = (window as any).gapi;
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

export function revokeToken(): void {
    const gapi = (window as any).gapi;
    const token = gapi.client.getToken();
    if (token !== null) {
        (window as any).google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken(null);
    }
    localStorage.removeItem('sales_gapi_token');
}

export function isAuthenticated(): boolean {
    try {
        const gapi = (window as any).gapi;
        return gapi?.client?.getToken() !== null;
    } catch {
        return false;
    }
}

// ============ Get User Email ============

export async function getUserEmail(): Promise<string> {
    const gapi = (window as any).gapi;
    const token = gapi.client.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const data = await response.json();
    return data.email || '';
}

// ============ Sheet Operations ============

async function readSheet(range: string): Promise<any[][]> {
    const gapi = (window as any).gapi;
    const response = await withRetry(() =>
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range,
        })
    );
    return (response as any).result.values || [];
}

async function appendToSheet(range: string, values: any[][]): Promise<any> {
    const gapi = (window as any).gapi;
    return withRetry(() =>
        gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: { values },
        })
    );
}

async function updateSheet(range: string, values: any[][]): Promise<any> {
    const gapi = (window as any).gapi;
    return withRetry(() =>
        gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range,
            valueInputOption: 'USER_ENTERED',
            resource: { values },
        })
    );
}

async function sheetExists(sheetName: string): Promise<boolean> {
    try {
        const gapi = (window as any).gapi;
        const response = await gapi.client.sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });
        const sheets = response.result.sheets || [];
        return sheets.some((s: any) => s.properties.title === sheetName);
    } catch {
        return false;
    }
}

async function createSheet(sheetName: string): Promise<void> {
    const gapi = (window as any).gapi;
    await withRetry(() =>
        gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: {
                requests: [
                    {
                        addSheet: {
                            properties: { title: sheetName },
                        },
                    },
                ],
            },
        })
    );
}

// ============ Initialize Sheet Structure ============

const SHEET_HEADERS: Record<string, string[]> = {
    [SHEETS.USERS]: ['Email', 'Name', 'Role'],
    [SHEETS.SALES_DATA]: [
        'Sale_ID', 'Date', 'Salesperson_Email', 'Salesperson_Name',
        'Status', 'Shop_Name', 'Location', 'Phone', 'Contact_Name',
        'Category', 'Plan', 'Payment_Method', 'Rejected_Reason',
        'Rejected_Categories', 'Timestamp',
    ],
    [SHEETS.TARGETS]: ['Salesperson_Email', 'Month', 'Year', 'Target_Count'],
};

export async function initializeSheets(): Promise<void> {
    for (const [sheetName, headers] of Object.entries(SHEET_HEADERS)) {
        const exists = await sheetExists(sheetName);
        if (!exists) {
            await createSheet(sheetName);
            await updateSheet(`${sheetName}!A1`, [headers]);
        }
    }

    // Auto-seed Users tab with the authorized sales team if empty
    const existingUsers = await fetchUsers();
    if (existingUsers.length === 0) {
        const seedData = SALES_TEAM.map((member) => [
            member.email,
            member.name,
            member.role,
        ]);
        await appendToSheet(`${SHEETS.USERS}!A:C`, seedData);
        clearCache();
    }
}

// ============ Users CRUD ============

export async function fetchUsers(): Promise<SalesUser[]> {
    const cached = getCached<SalesUser[]>('users');
    if (cached) return cached;

    const data = await readSheet(`${SHEETS.USERS}!A:C`);
    if (data.length <= 1) return [];

    const users = data.slice(1).map((row) => ({
        Email: (row[0] || '').toLowerCase().trim(),
        Name: row[1] || '',
        Role: (row[2] || 'salesperson') as 'salesperson' | 'manager',
    }));

    setCache('users', users);
    return users;
}

export async function findCurrentUser(email: string): Promise<SalesUser | null> {
    const normalizedEmail = email.toLowerCase().trim();

    // Whitelist is the single source of truth for access and role
    const whitelisted = SALES_TEAM.find((m) => m.email === normalizedEmail);
    if (!whitelisted) return null;

    // Always use whitelist data (role from constants, not from sheet)
    return { Email: whitelisted.email, Name: whitelisted.name, Role: whitelisted.role };
}

// ============ Sales Data ============

export async function fetchAllSalesData(): Promise<SaleEntry[]> {
    const cached = getCached<SaleEntry[]>('all_sales');
    if (cached) return cached;

    const data = await readSheet(`${SHEETS.SALES_DATA}!A:O`);
    if (data.length <= 1) return [];

    const sales = data.slice(1).map((row) => ({
        Sale_ID: row[0] || '',
        Date: row[1] || '',
        Salesperson_Email: row[2] || '',
        Salesperson_Name: row[3] || '',
        Status: (row[4] || 'Confirmed') as 'Confirmed' | 'Rejected',
        Shop_Name: row[5] || '',
        Location: row[6] || '',
        Phone: row[7] || '',
        Contact_Name: row[8] || '',
        Category: row[9] || '',
        Plan: row[10] || '',
        Payment_Method: row[11] || '',
        Rejected_Reason: row[12] || '',
        Rejected_Categories: row[13] || '',
        Timestamp: row[14] || '',
    }));

    setCache('all_sales', sales);
    return sales;
}

export async function fetchSalesData(email: string): Promise<SaleEntry[]> {
    const all = await fetchAllSalesData();
    const normalizedEmail = email.toLowerCase().trim();
    return all.filter((s) => s.Salesperson_Email.toLowerCase().trim() === normalizedEmail);
}

export async function addSaleEntry(
    entry: Omit<SaleEntry, 'Sale_ID' | 'Timestamp'>
): Promise<void> {
    const allSales = await fetchAllSalesData();
    const id = `SALE${String(allSales.length + 1).padStart(5, '0')}`;
    const timestamp = new Date().toISOString();

    await appendToSheet(`${SHEETS.SALES_DATA}!A:O`, [
        [
            id, entry.Date, entry.Salesperson_Email, entry.Salesperson_Name,
            entry.Status, entry.Shop_Name, entry.Location, entry.Phone,
            entry.Contact_Name, entry.Category, entry.Plan, entry.Payment_Method,
            entry.Rejected_Reason, entry.Rejected_Categories, timestamp,
        ],
    ]);

    clearCache();
}

// ============ Targets ============

export async function fetchTargets(email: string): Promise<Target[]> {
    const cacheKey = `targets_${email}`;
    const cached = getCached<Target[]>(cacheKey);
    if (cached) return cached;

    const data = await readSheet(`${SHEETS.TARGETS}!A:D`);
    if (data.length <= 1) return [];

    const normalizedEmail = email.toLowerCase().trim();
    const targets = data
        .slice(1)
        .filter((row) => (row[0] || '').toLowerCase().trim() === normalizedEmail)
        .map((row) => ({
            Salesperson_Email: row[0] || '',
            Month: row[1] || '',
            Year: parseInt(row[2]) || new Date().getFullYear(),
            Target_Count: parseInt(row[3]) || 15,
        }));

    setCache(cacheKey, targets);
    return targets;
}

export async function fetchAllTargets(): Promise<Target[]> {
    const cached = getCached<Target[]>('all_targets');
    if (cached) return cached;

    const data = await readSheet(`${SHEETS.TARGETS}!A:D`);
    if (data.length <= 1) return [];

    const targets = data.slice(1).map((row) => ({
        Salesperson_Email: row[0] || '',
        Month: row[1] || '',
        Year: parseInt(row[2]) || new Date().getFullYear(),
        Target_Count: parseInt(row[3]) || 15,
    }));

    setCache('all_targets', targets);
    return targets;
}

export async function setTarget(
    email: string,
    month: string,
    year: number,
    targetCount: number
): Promise<void> {
    const data = await readSheet(`${SHEETS.TARGETS}!A:D`);

    // Find existing row index for this email+month+year
    let foundRow = -1;
    if (data.length > 1) {
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (
                (row[0] || '').toLowerCase().trim() === email.toLowerCase().trim() &&
                (row[1] || '') === month &&
                parseInt(row[2]) === year
            ) {
                foundRow = i;
                break;
            }
        }
    }

    if (foundRow >= 0) {
        // Update existing row (1-indexed, +1 for header)
        await updateSheet(`${SHEETS.TARGETS}!A${foundRow + 1}:D${foundRow + 1}`, [
            [email, month, String(year), String(targetCount)],
        ]);
    } else {
        // Append new row
        await appendToSheet(`${SHEETS.TARGETS}!A:D`, [
            [email, month, String(year), String(targetCount)],
        ]);
    }

    clearCache();
}

// ============ Fetch All Data ============

export async function fetchAllData(email: string) {
    clearCache();
    const [users, salesData, targets, allSalesData] = await Promise.all([
        fetchUsers(),
        fetchSalesData(email),
        fetchTargets(email),
        fetchAllSalesData(),
    ]);

    return { users, salesData, targets, allSalesData };
}
