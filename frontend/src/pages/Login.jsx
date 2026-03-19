import React, { useState } from 'react';
import { Package, Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.response?.data?.error || 'System authentication failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-lg z-10">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-blue-600/10 rounded-3xl border border-blue-500/20 text-blue-500 mb-6 shadow-2xl shadow-blue-900/40 animate-bounce duration-[2000ms]">
            <Package size={48} />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2">NESTOR WORKS</h1>
          <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-xs">Luxury Enterprise POS Gateway</p>
        </header>

        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-[40px] shadow-2xl p-10 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 group-focus-within:bg-blue-400 transition-colors" />
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <ShieldCheck className="text-blue-500" /> IDENTITY VALIDATION
            </h2>

            {error && (
              <div className="bg-red-900/10 border border-red-500/50 p-4 rounded-2xl flex items-center gap-3 text-red-200 text-sm font-bold animate-in slide-in-from-left-4 duration-300">
                <AlertCircle size={20} className="text-red-500 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block pl-1">Registry Username</label>
                <div className="relative group/field font-medium">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within/field:text-blue-500 transition-colors" size={20} />
                  <input
                    required
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter ID..."
                    className="w-full bg-gray-950 border border-gray-800 rounded-2xl py-5 pl-14 pr-6 text-white focus:border-blue-500 focus:bg-gray-900 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block pl-1">Secure Passkey</label>
                <div className="relative group/field font-medium">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within/field:text-blue-500 transition-colors" size={20} />
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-950 border border-gray-800 rounded-2xl py-5 pl-14 pr-6 text-white focus:border-blue-500 focus:bg-gray-900 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-900/40 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  INITIALIZE SYSTEM <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-12 text-gray-600 text-[10px] font-black uppercase tracking-widest">
           Audited Environment &bull; Authorized Personnel Only
        </p>
      </div>
    </div>
  );
};

export default Login;
