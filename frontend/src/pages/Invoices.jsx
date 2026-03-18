import React, { useState } from 'react';
import { Search, Receipt, Download, Package, User, Phone, MapPin, Calendar, Clock, ArrowRight, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { salesApi, exchangeApi } from '../api';

const Invoices = () => {
  const [invoiceId, setInvoiceId] = useState('');
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!invoiceId) return;
    setLoading(true);
    setError(null);
    setSale(null);
    try {
      const { data } = await salesApi.getSaleById(invoiceId);
      setSale(data);
    } catch (err) { 
      setError('Invoice not found in the secure archives. Verify the ID and try again.'); 
    } finally { setLoading(false); }
  };

  const handleDownload = async () => {
    if (!sale) return;
    try {
      let response;
      let filename;
      if (sale.status === 'Exchange-Correction' && sale.exchange_info) {
        response = await exchangeApi.downloadPDF(sale.exchange_info.id);
        filename = `exchange_${sale.exchange_info.id}.pdf`;
      } else {
        response = await salesApi.downloadPDF(sale.id);
        filename = `bill_${sale.id}.pdf`;
      }
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { alert('Full document not available on server.'); }
  };

  return (
    <div className="p-4 md:p-8">
      <header className="mb-12">
        <h1 className="text-3xl font-black text-white mb-2 underline decoration-blue-500 underline-offset-8">Invoice Discovery Hub</h1>
        <p className="text-gray-400">Search and retrieve official financial documents</p>
      </header>

      <div className="max-w-4xl mx-auto">
        <section className="bg-gray-850 p-6 rounded-3xl border border-gray-800 shadow-2xl mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1 group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-blue-500 transition-colors" size={20} />
               <input 
                type="number" 
                value={invoiceId} 
                onChange={e => setInvoiceId(e.target.value)}
                placeholder="Enter Invoice ID (e.g. 42)" 
                className="w-full bg-gray-900 border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all outline-none shadow-inner"
               />
            </div>
            <button disabled={loading} type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl font-black shadow-lg transition-all active:scale-95 disabled:opacity-50">
              {loading ? 'RELOADING...' : 'DISCOVER'}
            </button>
          </form>
        </section>

        {error && (
          <div className="bg-red-900/10 border border-red-500/50 p-6 rounded-2xl flex items-center gap-4 text-red-200 animate-in slide-in-from-top-4 duration-300">
            <XCircle size={24} /> <span className="font-bold">{error}</span>
          </div>
        )}

        {sale && (
          <div className="bg-gray-850 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
            <header className="px-10 py-8 border-b border-gray-800 bg-gray-800/30 flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className={`${sale.status === 'Exchange-Correction' ? 'bg-purple-900/20 text-purple-400' : 'bg-blue-900/20 text-blue-400'} p-5 rounded-2xl`}>
                  {sale.status === 'Exchange-Correction' ? <RefreshCw size={32}/> : <Receipt size={32}/>}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Invoice #{sale.id}</h2>
                  <div className="flex items-center gap-4 mt-2">
                     <span className={`px-3 py-1 rounded text-[10px] font-black uppercase ${
                        sale.status === 'Exchanged' ? 'bg-yellow-900/20 text-yellow-500 border border-yellow-800' : 
                        sale.status === 'Exchange-Correction' ? 'bg-purple-900/20 text-purple-400 border border-purple-800' :
                        'bg-green-900/20 text-green-500 border border-green-800'
                      }`}>
                        {sale.status} RECORD
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1.5"><Calendar size={14}/> {new Date(sale.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <button onClick={handleDownload} className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all active:scale-95 shadow-2xl">
                <Download size={20} /> {sale.status === 'Exchange-Correction' ? 'DOWNLOAD VOUCHER' : 'DOWNLOAD INVOICE'}
              </button>
            </header>

            <div className="p-10 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h4 className="text-[10px] text-gray-600 font-black uppercase mb-3 tracking-[0.2em]">Customer</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-white font-bold text-lg"><User size={20} className="text-blue-500"/> {sale.customer_name || 'Walk-in'}</div>
                    <div className="flex items-center gap-3 text-gray-400 text-sm"><Phone size={14}/> {sale.customer_mobile || 'No Phone'}</div>
                    {sale.customer_address && <div className="flex items-center gap-3 text-gray-400 text-xs mt-2"><MapPin size={14}/> {sale.customer_address}</div>}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] text-gray-600 font-black uppercase mb-3 tracking-[0.2em]">Timestamp</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-white font-black"><Clock size={20} className="text-blue-500"/> {new Date(sale.created_at).toLocaleTimeString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <h4 className="text-[10px] text-gray-600 font-black uppercase mb-3 tracking-[0.2em]">Financial Snapshot</h4>
                  <p className="text-4xl font-black text-white">LKR {Number(sale.total_amount).toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Total Assets Captured</p>
                </div>
              </div>

              {sale.exchange_info && (
                <div className="p-8 bg-purple-900/10 rounded-[2.5rem] border-2 border-purple-500/10 shadow-inner relative overflow-hidden group">
                  <RefreshCw className="absolute -right-8 -bottom-8 text-purple-600/5 group-hover:scale-125 transition-transform duration-700" size={160} />
                  <h4 className="text-[10px] text-purple-400 font-black uppercase mb-8 tracking-[0.2em] relative z-10">Cross-Temporal Watch Swap Details</h4>
                  <div className="flex items-center gap-12 justify-center relative z-10">
                    <div className="text-center group-hover:-translate-x-2 transition-transform">
                      <div className="bg-red-900/20 p-5 rounded-3xl inline-block text-red-400 mb-3 shadow-xl border border-red-900/30"><Package size={28}/></div>
                      <p className="text-lg font-black text-white">{sale.exchange_info.old_name}</p>
                      <p className="text-[10px] text-red-500 uppercase font-black tracking-widest mt-1 italic">Returned Item</p>
                    </div>
                    <ArrowRight className="text-gray-700 drop-shadow-2xl" size={40} strokeWidth={3} />
                    <div className="text-center group-hover:translate-x-2 transition-transform">
                      <div className="bg-green-900/20 p-5 rounded-3xl inline-block text-green-400 mb-3 shadow-xl border border-green-900/30"><Package size={28}/></div>
                      <p className="text-lg font-black text-white">{sale.exchange_info.new_name}</p>
                      <p className="text-[10px] text-green-500 uppercase font-black tracking-widest mt-1 italic">Successful Upgrade</p>
                    </div>
                  </div>
                </div>
              )}

              {sale.items.length > 0 && (
                <div>
                  <h4 className="text-[10px] text-gray-600 font-black uppercase mb-4 tracking-[0.2em]">Inventory Breakdown</h4>
                  <div className="bg-gray-900 rounded-[2rem] border border-gray-800 divide-y divide-gray-950 overflow-hidden shadow-2xl">
                    {sale.items.map((it, idx) => (
                      <div key={idx} className="px-8 py-6 flex justify-between items-center hover:bg-white/5 transition-all">
                        <div className="flex items-center gap-6">
                          <div className="bg-gray-850 p-3 rounded-2xl text-gray-600"><Package size={20}/></div>
                          <div>
                            <p className="font-black text-white text-lg">{it.name}</p>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Inventory Logic: x{it.quantity} units</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-gray-300 font-bold">LKR {(it.selling_price * it.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sale.notes && (
                <div className="p-6 bg-blue-900/10 rounded-2xl border border-blue-900/20 text-sm text-blue-400 font-bold italic shadow-inner">
                   Document Metadata: {sale.notes}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;
