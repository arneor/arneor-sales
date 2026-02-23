import { format, differenceInDays, isWithinInterval, parseISO } from 'date-fns';
import { DEFAULT_TARGET } from './constants';
import { SaleEntry, Target } from './types';

/**
 * Get the current active period boundaries
 * Period runs from the 23rd of one month to the 23rd of the next
 */
export function getCurrentPeriod(): { start: Date; end: Date; label: string } {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();

    let start: Date;
    let end: Date;

    if (day >= 23) {
        // Current period: 23rd of this month to 23rd of next month
        start = new Date(year, month, 23);
        const nextMonth = month + 1;
        end = new Date(nextMonth > 11 ? year + 1 : year, nextMonth % 12, 23);
    } else {
        // Current period: 23rd of last month to 23rd of this month
        const prevMonth = month - 1;
        start = new Date(prevMonth < 0 ? year - 1 : year, (prevMonth + 12) % 12, 23);
        end = new Date(year, month, 23);
    }

    const label = `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
    return { start, end, label };
}

/**
 * Get the target count for the current period
 */
export function getCurrentTarget(targets: Target[]): number {
    const { start } = getCurrentPeriod();
    const monthName = format(start, 'MMMM');
    const year = start.getFullYear();

    const match = targets.find(
        (t) => t.Month === monthName && t.Year === year
    );
    return match?.Target_Count ?? DEFAULT_TARGET;
}

/**
 * Filter sales within the current active period
 */
export function getSalesInPeriod(sales: SaleEntry[]): SaleEntry[] {
    const { start, end } = getCurrentPeriod();
    return sales.filter((s) => {
        try {
            const saleDate = parseISO(s.Date);
            return isWithinInterval(saleDate, { start, end });
        } catch {
            return false;
        }
    });
}

/**
 * Get confirmed sales count in the current period
 */
export function getConfirmedCount(sales: SaleEntry[]): number {
    return getSalesInPeriod(sales).filter((s) => s.Status === 'Confirmed').length;
}

/**
 * Get rejected sales count in the current period
 */
export function getRejectedCount(sales: SaleEntry[]): number {
    return getSalesInPeriod(sales).filter((s) => s.Status === 'Rejected').length;
}

/**
 * Calculate daily pace to meet target
 */
export function calculateDailyPace(
    currentCount: number,
    targetCount: number
): { required: number; isOnTrack: boolean; daysRemaining: number; expectedCount: number } {
    const { start, end } = getCurrentPeriod();
    const now = new Date();
    const totalDays = differenceInDays(end, start);
    const daysElapsed = differenceInDays(now, start);
    const daysRemaining = Math.max(0, differenceInDays(end, now));

    const dailyRate = totalDays > 0 ? targetCount / totalDays : 0;
    const expectedCount = Math.round(dailyRate * daysElapsed);
    const remaining = targetCount - currentCount;
    const required = daysRemaining > 0 ? remaining / daysRemaining : remaining;
    const isOnTrack = currentCount >= expectedCount;

    return { required: Math.max(0, required), isOnTrack, daysRemaining, expectedCount };
}

/**
 * Get progress percentage (capped at 100)
 */
export function getProgressPercentage(current: number, target: number): number {
    if (target <= 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
}

/**
 * Get timeline progress percentage (how far through the period we are)
 */
export function getTimelineProgress(): number {
    const { start, end } = getCurrentPeriod();
    const now = new Date();
    const totalDays = differenceInDays(end, start);
    const daysElapsed = differenceInDays(now, start);

    if (totalDays <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));
}

/**
 * Format a date string for display
 */
export function formatDate(dateStr: string): string {
    try {
        return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch {
        return dateStr;
    }
}

/**
 * Format a date string with time
 */
export function formatDateTime(dateStr: string): string {
    try {
        return format(parseISO(dateStr), 'MMM d, yyyy h:mm a');
    } catch {
        return dateStr;
    }
}

/**
 * Get today's date as ISO string (date only)
 */
export function getTodayISO(): string {
    return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Conversion rate calculation
 */
export function getConversionRate(confirmed: number, total: number): number {
    if (total <= 0) return 0;
    return Math.round((confirmed / total) * 100);
}
