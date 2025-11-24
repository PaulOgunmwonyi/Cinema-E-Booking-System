"use client";

import React, { useEffect, useState } from 'react';
import { apiService, Promotion } from '@/app/utils/api';
import { useRouter } from 'next/navigation';

const AdminPromotionsPage = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res = await apiService.fetchApi<{ promotions: Promotion[] }>('/api/admin/promotions', { method: 'GET' }, true);
      setPromotions(res.promotions || []);
    } catch (e) {
      console.error('Failed to load promotions', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleSend = async (code: string) => {
    try {
      await apiService.sendPromotion(code);
      // Refresh after sending
      await fetchPromotions();
      alert('Promotion send requested. Check server logs for confirmation.');
    } catch (e: any) {
      alert(e?.message || 'Failed to send promotion');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-900 flex items-start py-12">
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Manage Promotions</h1>
            <div>
              <button className="glass-button px-4 py-2 rounded-lg font-bold text-white" onClick={() => setShowModal(true)}>Add Promotion</button>
              <button className="ml-3 px-4 py-2 rounded-lg bg-gray-700 text-white font-bold" onClick={() => router.push('/pages/admin')}>Back</button>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg text-white font-semibold mb-4">Existing Promotions</h2>
          {loading ? (
            <div className="text-white">Loading...</div>
          ) : promotions.length === 0 ? (
            <div className="text-white/80">No promotions yet.</div>
          ) : (
            <table className="w-full text-left text-white">
              <thead>
                <tr>
                  <th className="pb-2">Code</th>
                  <th className="pb-2">Title</th>
                  <th className="pb-2">Valid</th>
                  <th className="pb-2">Discount</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((p) => (
                  <tr key={p.id} className="border-t border-white/10">
                    <td className="py-3">{p.code}</td>
                    <td className="py-3">{p.title}</td>
                    <td className="py-3">{new Date(p.start_date).toLocaleDateString()} - {new Date(p.end_date).toLocaleDateString()}</td>
                    <td className="py-3">{p.discount_percent}%</td>
                    <td className="py-3">
                      <button className="glass-button px-3 py-1 rounded font-bold text-white" onClick={() => handleSend(p.code)}>Send</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showModal && (
          <CreatePromotionModal onClose={() => { setShowModal(false); fetchPromotions(); }} />
        )}
      </div>
    </div>
  );
};

function CreatePromotionModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [discount, setDiscount] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      await apiService.createPromotion({
        code: code.trim().toUpperCase(),
        title,
        description,
        start_date: startDate,
        end_date: endDate,
        discount_percent: Number(discount),
      } as any);
      alert('Promotion created');
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Failed to create promotion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={() => onClose()} />
      <div className="glass-card p-6 z-10 w-full max-w-2xl">
        <h3 className="text-xl font-bold text-white mb-4">Create Promotion</h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="text-white/80">Code</label>
            <input className="w-full mt-1 p-2 rounded bg-black/30 text-white" value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <div>
            <label className="text-white/80">Title</label>
            <input className="w-full mt-1 p-2 rounded bg-black/30 text-white" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="text-white/80">Description</label>
            <textarea className="w-full mt-1 p-2 rounded bg-black/30 text-white" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/80">Start</label>
              <input type="datetime-local" className="w-full mt-1 p-2 rounded bg-black/30 text-white" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className="text-white/80">End</label>
              <input type="datetime-local" className="w-full mt-1 p-2 rounded bg-black/30 text-white" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="text-white/80">Discount %</label>
            <input type="number" min={1} max={100} className="w-full mt-1 p-2 rounded bg-black/30 text-white" value={discount as any} onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))} required />
          </div>

          <div className="flex justify-end">
            <button type="button" className="px-4 py-2 rounded bg-gray-600 text-white mr-3" onClick={() => onClose()} disabled={loading}>Cancel</button>
            <button type="submit" className="glass-button px-4 py-2 rounded font-bold text-white" disabled={loading}>Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminPromotionsPage;
