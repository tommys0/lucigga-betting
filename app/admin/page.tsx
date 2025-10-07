'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface User {
  id: string;
  username: string;
  role: string;
  playerId: string | null;
  player: {
    name: string;
    points: number;
  } | null;
  createdAt: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState<string | null>(null);

  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'user',
    playerName: '',
  });

  const [passwordUpdate, setPasswordUpdate] = useState({
    userId: '',
    password: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchUsers();
    }
  }, [status, session, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        setNewUser({ username: '', password: '', role: 'user', playerName: '' });
        setShowCreateForm(false);
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create user');
      }
    } catch (error) {
      alert('Failed to create user');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordUpdate),
      });

      if (response.ok) {
        setPasswordUpdate({ userId: '', password: '' });
        setShowPasswordForm(null);
        alert('Password updated successfully');
      } else {
        alert('Failed to update password');
      }
    } catch (error) {
      alert('Failed to update password');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUsers();
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-purple-900 flex items-center justify-center">
        <p className="text-white text-2xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-purple-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-bold text-white mb-2">🔐 Admin Dashboard</h1>
            <p className="text-purple-200 text-xl">Manage users and permissions</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
            >
              ← Back to Betting
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
            >
              Sign Out
            </button>
          </div>
        </header>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white">Users ({users.length})</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition"
            >
              {showCreateForm ? 'Cancel' : '+ Create User'}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateUser} className="bg-white/10 p-6 rounded-lg mb-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2">Username</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border-2 border-white/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border-2 border-white/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border-2 border-white/30"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white mb-2">Player Name (optional)</label>
                  <input
                    type="text"
                    value={newUser.playerName}
                    onChange={(e) => setNewUser({ ...newUser, playerName: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border-2 border-white/30"
                    placeholder="Link to player profile"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition"
              >
                Create User
              </button>
            </form>
          )}

          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="bg-white/10 p-6 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{user.username}</h3>
                    <p className="text-purple-200">
                      Role: <span className="font-bold">{user.role}</span>
                    </p>
                    {user.player && (
                      <p className="text-purple-200">
                        Player: <span className="font-bold">{user.player.name}</span> ({user.player.points} pts)
                      </p>
                    )}
                    <p className="text-purple-300 text-sm mt-1">
                      Created: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowPasswordForm(user.id);
                        setPasswordUpdate({ userId: user.id, password: '' });
                      }}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition"
                    >
                      Change Password
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {showPasswordForm === user.id && (
                  <form onSubmit={handleUpdatePassword} className="mt-4 p-4 bg-white/10 rounded-lg space-y-3">
                    <input
                      type="password"
                      value={passwordUpdate.password}
                      onChange={(e) => setPasswordUpdate({ ...passwordUpdate, password: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border-2 border-white/30"
                      placeholder="New password"
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPasswordForm(null)}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
