'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { addSaleEntry } from '@/lib/google-sheets';
import { getTodayISO } from '@/lib/utils';
import { PRODUCT_CATEGORIES, PRODUCT_PLANS, PLANS, PAYMENT_METHODS } from '@/lib/constants';
import { CheckCircle, Send } from 'lucide-react';

export default function ConfirmedSalePage() {
    const { currentUser, userEmail, refreshData, addAlert, setCurrentPage } = useApp();

    const [form, setForm] = useState({
        date: getTodayISO(),
        contactName: '',
        shopName: '',
        location: '',
        phone: '',
        category: '',
        plan: '',
        paymentMethod: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const isValid = form.shopName.trim() !== '' && form.phone.trim() !== '';

    const handleChange = (field: string, value: string) => {
        setForm((f) => {
            const nextForm = { ...f, [field]: value };

            // If category changes, reset plan if it's not valid for the new category
            if (field === 'category') {
                const availablePlans = PRODUCT_PLANS[value] || [];
                if (!availablePlans.includes(f.plan)) {
                    nextForm.plan = '';
                }
            }

            return nextForm;
        });
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
                Status: 'Confirmed',
                Shop_Name: form.shopName,
                Location: form.location,
                Phone: form.phone,
                Contact_Name: form.contactName,
                Category: form.category,
                Plan: form.plan,
                Payment_Method: form.paymentMethod,
                Rejected_Reason: '',
                Rejected_Categories: '',
            });

            setSubmitted(true);
            addAlert({ type: 'success', message: 'Confirmed sale recorded successfully!' });
            await refreshData();

            setTimeout(() => {
                setSubmitted(false);
                setForm({
                    date: getTodayISO(),
                    contactName: '',
                    shopName: '',
                    location: '',
                    phone: '',
                    category: '',
                    plan: '',
                    paymentMethod: '',
                });
            }, 2000);
        } catch (err) {
            console.error('Submit error:', err);
            addAlert({ type: 'error', message: 'Failed to submit sale. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="form-page">
                <div className="success-screen">
                    <div className="success-icon-container">
                        <CheckCircle size={64} />
                    </div>
                    <h2>Sale Confirmed! 🎉</h2>
                    <p>Your sale has been recorded successfully.</p>
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
                    <CheckCircle size={24} className="text-success" />
                    <div>
                        <h2>Record Confirmed Sale</h2>
                        <p>Log a successful sale conversion</p>
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
                            <label className="form-label">Shop Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Business / Shop name"
                                value={form.shopName}
                                onChange={(e) => handleChange('shopName', e.target.value)}
                                required
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
                            <label className="form-label">Phone *</label>
                            <input
                                type="tel"
                                className="form-input"
                                placeholder="Contact phone number"
                                value={form.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Product Category</label>
                            <select
                                className="form-input"
                                value={form.category}
                                onChange={(e) => handleChange('category', e.target.value)}
                            >
                                <option value="">Select category</option>
                                {PRODUCT_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Plan</label>
                            <select
                                className="form-input"
                                value={form.plan}
                                onChange={(e) => handleChange('plan', e.target.value)}
                            >
                                <option value="">Select plan</option>
                                {form.category ? (
                                    PRODUCT_PLANS[form.category]?.map((plan) => (
                                        <option key={plan} value={plan}>{plan}</option>
                                    ))
                                ) : (
                                    PLANS.map((plan) => (
                                        <option key={plan} value={plan}>{plan}</option>
                                    ))
                                )}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Payment Method</label>
                            <select
                                className="form-input"
                                value={form.paymentMethod}
                                onChange={(e) => handleChange('paymentMethod', e.target.value)}
                            >
                                <option value="">Select method</option>
                                {PAYMENT_METHODS.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {!isValid && (
                        <div className="form-validation-hint">
                            <span>⚠️ Shop Name and Phone are required to submit</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-submit"
                        disabled={!isValid || isSubmitting}
                    >
                        <Send size={16} />
                        {isSubmitting ? 'Submitting...' : 'Submit Confirmed Sale'}
                    </button>
                </form>
            </div>
        </div>
    );
}
