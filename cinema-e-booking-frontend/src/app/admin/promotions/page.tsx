"use client";

import React, { useState } from 'react';
import { apiService, Promotion } from '@/app/utils/api';

export default function AdminPromotionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [discount, setDiscount] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        title,
        description,
        start_date: startDate,
        end_date: endDate,
        discount_percent: Number(discount),
      };

      const res = await apiService.createPromotion(payload as any);
      setMessage(res.message || 'Promotion created');
      setShowForm(false);
      // Optionally offer to send — we'll show a quick send CTA
    } catch (err: any) {
      setMessage(err?.message || 'Failed to create promotion');
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    setMessage(null);
    setLoading(true);
    try {
      await apiService.sendPromotion(code.trim().toUpperCase());
      setMessage('Promotion sent (server reported success)');
    } catch (err: any) {
      setMessage(err?.message || 'Failed to send promotion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Manage Promotions</h1>

      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <button onClick={() => setShowForm(true)}>Add Promotion</button>
      </div>

      {message && (
        <div style={{ marginBottom: 12 }}>{message}</div>
      )}

      {showForm && (
        <div style={{ border: '1px solid #ddd', padding: 12, maxWidth: 700 }}>
          <h2>Create Promotion</h2>
          <form onSubmit={handleCreate}>
            <div style={{ marginBottom: 8 }}>
              <label>Code</label>
              <br />
              <input value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Title</label>
              <br />
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Description</label>
              <br />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Start Date</label>
              <br />
              <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>End Date</label>
              <br />
              <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Discount %</label>
              <br />
              <input type="number" min={1} max={100} value={discount as any} onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))} required />
            </div>

            <div style={{ marginTop: 10 }}>
              <button type="submit" disabled={loading}>Create</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ marginLeft: 8 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <b>Quick send:</b>
        <div style={{ marginTop: 8 }}>
          <input placeholder="Promotion code" value={code} onChange={(e) => setCode(e.target.value)} />
          <button onClick={handleSend} disabled={loading || !code.trim()} style={{ marginLeft: 8 }}>Send Promotion</button>
        </div>
        <div style={{ marginTop: 8, color: '#666' }}>
          Note: Only users who subscribed to promotions will receive emails.
        </div>
      </div>
    </div>
  );
}
