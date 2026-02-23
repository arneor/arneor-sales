'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { addSaleEntry } from '@/lib/google-sheets';
import { getTodayISO } from '@/lib/utils';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { MultiSelectChips } from '@/components/ui/SharedComponents';
import { XCircle, Send } from 'lucide-react';

export default function RejectedSalePage() {
    const { currentUser, userEmail, refreshData, addAlert, setCurrentPage } = useApp();

    const [form, setForm] = useState({
        date: getTodayISO(),
        contactName: '',
        shopName: '',
        location: '',
        phone: '',
        rejectedReason: '',
    });
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const isValid = form.rejectedReason.trim() !== '';

    const handleChange = (field: string, value: string) => {
        setForm((f) => ({ ...f, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await addSaleEntry({
                Date: form.date,
                Salesperson_Email: userEmail,
                Salesperson_Name: currentUser?.Name || '',
                Status: 'Rejected',
                Shop_Name: form.shopName,
                Location: form.location,
                Phone: form.phone,
                Contact_Name: form.contactName,
                Category: selectedCategories.join(', '),
                Plan: '',
                Payment_Method: '',
                Rejected_Reason: form.rejectedReason,
                Rejected_Categories: selectedCategories.join(', '),
            });

            setSubmitted(true);
            addAlert({ type: 'success', message: 'Rejected sale recorded for market intelligence.' });
            await refreshData();

            setTimeout(() => {
                setSubmitted(false);
                setForm({
                    date: getTodayISO(),
                    contactName: '',
                    shopName: '',
                    location: '',
                    phone: '',
                    rejectedReason: '',
                });
                setSelectedCategories([]);
            }, 2000);
        } catch (err) {
            console.error('Submit error:', err);
            addAlert({ type: 'error', message: 'Failed to submit. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="form-page">
                <div className="success-screen rejected-success">
                    <div className="success-icon-container rejected">
                        <XCircle size={64} />
                    </div>
                    <h2>Feedback Recorded 📋</h2>
                    <p>This rejection data helps our research team improve products.</p>
                    <button className="btn btn-primary" onClick={() => setCurrentPage('dashboard')}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="form-page">
            <div className="form-card glass-card">
                <div className="form-header">
                    <XCircle size={24} className="text-danger" />
                    <div>
                        <h2>Record Rejected Sale</h2>
                        <p>Log rejection feedback for market intelligence</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="sale-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Date *</label>
                            <input
                                type="date"
                                className="form-input"
                                value={form.date}
                                onChange={(e) => handleChange('date', e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Contact Name</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Contact person name"
                                value={form.contactName}
                                onChange={(e) => handleChange('contactName', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Shop Name</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Business / Shop name"
                                value={form.shopName}
                                onChange={(e) => handleChange('shopName', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Location</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="City / Area"
                                value={form.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Phone</label>
                            <input
                                type="tel"
                                className="form-input"
                                placeholder="Contact phone number"
                                value={form.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Multi-select product categories */}
                    <MultiSelectChips
                        options={PRODUCT_CATEGORIES}
                        selected={selectedCategories}
                        onChange={setSelectedCategories}
                        label="Product Categories Discussed (select all that apply)"
                    />

                    <div className="form-group full-width">
                        <label className="form-label">Rejected Reason *</label>
                        <textarea
                            className="form-input form-textarea"
                            placeholder="Why was the sale rejected? (e.g., price too high, not interested, competitor preference, budget constraints...)"
                            value={form.rejectedReason}
                            onChange={(e) => handleChange('rejectedReason', e.target.value)}
                            required
                            rows={4}
                        />
                    </div>

                    {!isValid && (
                        <div className="form-validation-hint">
                            <span>⚠️ Rejected Reason is required to submit</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-danger btn-submit"
                        disabled={!isValid || isSubmitting}
                    >
                        <Send size={16} />
                        {isSubmitting ? 'Submitting...' : 'Submit Rejection Report'}
                    </button>
                </form>
            </div>
        </div>
    );
}
