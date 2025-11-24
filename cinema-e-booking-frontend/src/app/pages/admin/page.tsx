'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiService, AdminMenuItem } from '../../utils/api';

const AdminHomePage = () => {
  const [menu, setMenu] = useState<AdminMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiService.getAdminHome()
      .then((data) => {
        setMenu(data.menu);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-black to-red-900">
        <div className="glass-card p-8 text-white text-xl">Loading admin menu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-900 flex flex-col items-center justify-center">
      <div className="glass-card p-8 w-full max-w-xl">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Admin Main Menu</h1>
        <ul className="space-y-4">
          {menu.map((item) => (
            <li key={item.path}>
              <button
                className="w-full glass-button py-4 rounded-lg font-bold text-white text-lg hover:text-gray-200 shadow-lg transition-all duration-200"
                onClick={() => router.push(item.path)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminHomePage;