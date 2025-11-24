'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // <-- Add this import
import { apiService } from '../../../utils/api';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;      // keep if you use it elsewhere
  is_suspended: boolean;   // add this
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const router = useRouter(); // <-- Add this line

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiService.fetchApi<{ users: User[] }>('/api/admin/users', { method: 'GET' }, true);
      setUsers(res.users);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch users');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Add new admin
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await apiService.fetchApi('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: newAdminEmail,
          password: newAdminPassword,
          is_admin: true,
        }),
        headers: { 'Content-Type': 'application/json' },
      }, true);
      setSuccess('New administrator added!');
      setNewAdminEmail('');
      setNewAdminPassword('');
      fetchUsers();
    } catch (e: any) {
      setError(e?.message || 'Failed to add admin');
    }
  };

  // Update user (toggle admin or suspend/activate)
  const handleUpdateUser = async (id: string, updates: Partial<User>) => {
    setError('');
    setSuccess('');
    try {
      await apiService.fetchApi(`/api/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
        headers: { 'Content-Type': 'application/json' },
      }, true);
      setSuccess('User updated!');
      fetchUsers();
    } catch (e: any) {
      setError(e?.message || 'Failed to update user');
    }
  };

  // Delete user
  const handleDeleteUser = async (id: string) => {
    setError('');
    setSuccess('');
    try {
      await apiService.fetchApi(`/api/admin/users/${id}`, {
        method: 'DELETE',
      }, true);
      setSuccess('User deleted!');
      fetchUsers();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-900 flex flex-col items-center py-10">
      <button
        className="mb-6 px-6 py-2 rounded-lg bg-gray-700 text-white font-bold hover:bg-gray-600 transition"
        onClick={() => router.push('/pages/admin')}
      >
        Go Back
      </button>
      <div className="glass-card p-8 w-full max-w-2xl mb-8">
        <h1 className="text-2xl font-bold text-white mb-4">Manage Users</h1>
        <form onSubmit={handleAddAdmin} className="space-y-4 mb-6">
          <h2 className="text-lg text-white font-semibold">Add New Administrator</h2>
          <input
            type="email"
            placeholder="Admin Email"
            value={newAdminEmail}
            onChange={e => setNewAdminEmail(e.target.value)}
            className="glass-input w-full px-4 py-2 rounded-lg text-white bg-black"
            required
          />
          <input
            type="password"
            placeholder="Temporary Password"
            value={newAdminPassword}
            onChange={e => setNewAdminPassword(e.target.value)}
            className="glass-input w-full px-4 py-2 rounded-lg text-white bg-black"
            required
          />
          <button
            type="submit"
            className="glass-button w-full py-2 rounded-lg font-bold text-white hover:text-gray-200 shadow-lg"
          >
            Add Admin
          </button>
        </form>
        {error && <div className="text-red-400 mb-2">{error}</div>}
        {success && <div className="text-green-400 mb-2">{success}</div>}
      </div>

      <div className="glass-card p-8 w-full max-w-4xl">
        <h2 className="text-xl font-bold text-white mb-4">All Members</h2>
        {loading ? (
          <div className="text-white">Loading...</div>
        ) : (
          <table className="min-w-full text-white">
            <thead>
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Admin</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-4 py-2">{user.first_name} {user.last_name}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">{user.is_admin ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-2">{user.is_suspended ? 'Suspended' : 'Active'}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      className="px-2 py-1 bg-blue-600 rounded text-white"
                      onClick={() => handleUpdateUser(user.id, { is_admin: !user.is_admin })}
                    >
                      {user.is_admin ? 'Revoke Admin' : 'Make Admin'}
                    </button>
                    <button
                      className={`px-2 py-1 rounded text-white ${user.is_admin ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-600'}`}
                      onClick={() => {
                        if (!user.is_admin) {
                          handleUpdateUser(user.id, { is_suspended: !user.is_suspended });
                        }
                      }}
                      disabled={user.is_admin}
                      title={user.is_admin ? "Cannot suspend another admin" : ""}
                    >
                      {user.is_suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                    <button
                      className="px-2 py-1 bg-red-600 rounded text-white"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-400">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;