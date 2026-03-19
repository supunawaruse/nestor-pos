import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, User, Key, Save, XCircle, Trash2, Edit3, CheckCircle } from 'lucide-react';
import { userApi } from '../api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '', password: '', role: 'Employee'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await userApi.getAll();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUser) {
        await userApi.update(editingUser.id, formData);
        setMessage({ type: 'success', text: `Access credentials for ${formData.username} have been updated.` });
      } else {
        await userApi.add(formData);
        setMessage({ type: 'success', text: `New operative ${formData.username} has been inducted into the system.` });
      }
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: 'Identity collision or server validation error.' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you certain you wish to revoke this operative\'s system access?')) return;
    try {
      await userApi.delete(id);
      fetchUsers();
    } catch (err) {
      alert('Cannot delete active system anchor.');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Don't show old password
      role: user.role
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ username: '', password: '', role: 'Employee' });
    setEditingUser(null);
  };

  return (
    <div className="p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
        <div>
          <h1 className="text-3xl font-black text-white mb-2 underline decoration-blue-500 underline-offset-8">Staff Governance Console</h1>
          <p className="text-gray-400 font-medium">Manage system access privileges and staff identities</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all active:scale-95 shadow-2xl shadow-blue-900/40"
        >
          <UserPlus size={20} /> INDUCT OPERATIVE
        </button>
      </header>

      {message && (
        <div className={`mb-8 p-6 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 border ${
          message.type === 'error' ? 'bg-red-900/10 border-red-500 text-red-100' : 'bg-green-900/10 border-green-500 text-green-100'
        }`}>
          {message.type === 'error' ? <XCircle size={24}/> : <CheckCircle size={24}/>}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      <div className="bg-gray-850 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-800/50 text-[10px] uppercase font-black tracking-[0.2em] text-gray-500">
            <tr>
              <th className="px-8 py-6">Operative Identity</th>
              <th className="px-8 py-6">Privilege Level</th>
              <th className="px-8 py-6">Induction Date</th>
              <th className="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-white/5 transition-all group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${user.role === 'Admin' ? 'bg-purple-900/20 text-purple-400' : 'bg-blue-900/20 text-blue-400'}`}>
                      <User size={20}/>
                    </div>
                    <div>
                      <p className="text-white font-black text-lg">{user.username}</p>
                      <p className="text-xs text-gray-500 font-bold italic">User ID: #{user.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    user.role === 'Admin' ? 'bg-purple-900/20 text-purple-400 border border-purple-800/50' : 'bg-blue-900/20 text-blue-400 border border-blue-800/50'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-8 py-6 text-gray-400 font-bold text-sm">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-8 py-6">
                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(user)} className="p-3 bg-gray-800 hover:bg-blue-900/40 text-blue-400 rounded-xl transition-all">
                      <Edit3 size={18}/>
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="p-3 bg-gray-800 hover:bg-red-900/40 text-red-500 rounded-xl transition-all">
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-gray-850 border border-gray-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <header className="bg-gray-800 p-6 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-black text-white flex items-center gap-3">
                <Shield className="text-blue-500" /> {editingUser ? 'Acknowledge Re-Entry' : 'New Operative Induction'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500 hover:text-white transition-colors">
                <XCircle size={28} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block">Login Username</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500" size={18} />
                  <input
                    required
                    type="text"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter unique ID..."
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block">Secure Passkey {editingUser && '(Leave blank for no change)'}</label>
                <div className="relative group">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500" size={18} />
                  <input
                    required={!editingUser}
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block">Clearance Level</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'Employee' })}
                    className={`p-4 rounded-xl border font-black text-xs transition-all ${
                      formData.role === 'Employee' ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-gray-900 border-gray-800 text-gray-500 hover:bg-gray-800'
                    }`}
                  >
                    EMPLOYEE
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'Admin' })}
                    className={`p-4 rounded-xl border font-black text-xs transition-all ${
                      formData.role === 'Admin' ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-gray-900 border-gray-800 text-gray-500 hover:bg-gray-800'
                    }`}
                  >
                    ADMIN
                  </button>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 bg-gray-800 hover:bg-gray-750 text-white font-bold py-4 rounded-2xl transition-all active:scale-95"
                >
                  ABORT
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/40 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <Save size={20} /> {editingUser ? 'UPDATE CLEARANCE' : 'FINALIZE INDUCTION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
