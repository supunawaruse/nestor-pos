import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Calendar, RefreshCcw, Download, FileText, ChevronRight, ArrowLeft, Receipt, Printer, ChevronLeft, ChevronDown, User, Phone, RefreshCw, Package, ArrowRight, X, ExternalLink } from 'lucide-react';
import { salesApi, exchangeApi } from '../api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SaleDetailsModal = ({ saleId, onClose }) => {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (saleId) fetchSale();
  }, [saleId]);

  const fetchSale = async () => {
    setLoading(true);
    try {
      const { data } = await salesApi.getSaleById(saleId);
      setSale(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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
    } catch (err) { alert('Digital certificate not found on server.'); }
  };

  if (!saleId) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <header className="px-8 py-6 border-b border-gray-800 bg-gray-800/20 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <Receipt className="text-blue-500" /> Linked Invoice #{saleId}
            </h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Audit View Mode</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-gray-500"><X /></button>
        </header>

        <div className="p-8 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="p-20 text-center text-gray-600 animate-pulse font-black uppercase tracking-widest">Retrieving Linked Record...</div>
          ) : !sale ? (
            <div className="p-20 text-center text-red-500 font-bold italic">Bill not found in secure archives.</div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-[10px] text-gray-600 font-black uppercase mb-2 tracking-widest">Customer Profile</h4>
                  <div className="flex items-center gap-3 text-white font-bold"><User size={16} className="text-blue-500"/> {sale.customer_name || 'Walk-in Guest'}</div>
                  <div className="text-xs text-gray-500 mt-1">{sale.customer_mobile || 'No Contact Linked'}</div>
                </div>
                <div className="text-right">
                  <h4 className="text-[10px] text-gray-600 font-black uppercase mb-2 tracking-widest">Invoice Date</h4>
                  <div className="text-white font-bold">{new Date(sale.created_at).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(sale.created_at).toLocaleTimeString()}</div>
                </div>
              </div>

              {sale.exchange_info && (
                <div className="p-6 bg-purple-900/10 rounded-3xl border-2 border-purple-500/20 border-dashed">
                  <h4 className="text-[10px] text-purple-400 font-black uppercase mb-4 tracking-widest">Watch Exchange Detail</h4>
                  <div className="flex items-center gap-6 justify-center">
                    <div className="text-center">
                      <div className="bg-red-900/20 p-3 rounded-2xl inline-block text-red-400 mb-2"><Package size={20}/></div>
                      <p className="text-xs font-bold text-white max-w-[120px] line-clamp-2">{sale.exchange_info.old_name}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-black">Returned</p>
                    </div>
                    <ArrowRight className="text-gray-700" size={24} />
                    <div className="text-center">
                      <div className="bg-green-900/20 p-3 rounded-2xl inline-block text-green-400 mb-2"><Package size={20}/></div>
                      <p className="text-xs font-bold text-white max-w-[120px] line-clamp-2">{sale.exchange_info.new_name}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-black">Replacement</p>
                    </div>
                  </div>
                </div>
              )}

              {sale.items.length > 0 && (
                <div>
                  <h4 className="text-[10px] text-gray-600 font-black uppercase mb-3 tracking-widest">Inventory Detail</h4>
                  <div className="bg-gray-900 shadow-inner rounded-2xl border border-gray-800 divide-y divide-gray-950 overflow-hidden">
                    {sale.items.map((it, idx) => (
                      <div key={idx} className="p-4 flex justify-between items-center hover:bg-white/5 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-gray-950 rounded-lg text-gray-600"><Package size={16}/></div>
                          <div>
                            <p className="text-sm font-bold text-white">{it.name}</p>
                            <p className="text-[10px] text-gray-600 font-black uppercase tracking-tighter">Qty: {it.quantity}</p>
                          </div>
                        </div>
                        <p className="text-sm font-mono text-gray-300">LKR {(it.selling_price * it.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-end border-t border-gray-800 pt-6">
                 <div>
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                    sale.status === 'Exchanged' ? 'bg-yellow-900/20 text-yellow-500 border border-yellow-800' : 
                    sale.status === 'Exchange-Correction' ? 'bg-purple-900/20 text-purple-400 border border-purple-800' :
                    'bg-green-900/20 text-green-500 border border-green-800'
                  }`}>
                    {sale.status}
                  </span>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] text-gray-600 font-black uppercase mb-1 tracking-widest">
                      {sale.status === 'Exchange-Correction' ? 'Price Delta' : 'Total Asset Value'}
                    </p>
                    <p className="text-3xl font-black text-white">LKR {Number(sale.total_amount).toLocaleString()}</p>
                 </div>
              </div>

              {sale.notes && (
                <div className="p-4 bg-blue-900/10 rounded-xl border border-blue-900/20 text-xs text-blue-400 font-medium italic">
                   Note: {sale.notes}
                </div>
              )}
            </div>
          )}
        </div>
        
        <footer className="px-8 py-6 bg-gray-950 border-t border-gray-800 flex justify-between gap-4">
          <button onClick={handleDownload} disabled={loading || !sale} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-3 transition-all active:scale-95 disabled:opacity-20">
            <Download size={20} /> DOWNLOAD PDF
          </button>
          <button onClick={onClose} className="px-12 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-black transition-all border border-gray-700">
            CLOSE
          </button>
        </footer>
      </div>
    </div>
  );
};

const Reports = () => {
  const [dailyStats, setDailyStats] = useState([]);
  const [detailedSales, setDetailedSales] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null); // 'YYYY-MM-DD'
  const [loading, setLoading] = useState(true);
  const [modalSaleId, setModalSaleId] = useState(null);

  // Journal Pagination (Main list of dates)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Ledger Pagination (Details for a specific date)
  const [ledgerPage, setLedgerPage] = useState(1);
  const ledgerItemsPerPage = 10;

  useEffect(() => {
    fetchDailySummary();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      setLedgerPage(1); // Reset page on date change
      fetchDateSpecificSales(selectedDate);
    }
  }, [selectedDate]);

  const fetchDailySummary = async () => {
    setLoading(true);
    try {
      const { data } = await salesApi.getDailyReport();
      setDailyStats(data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const fetchDateSpecificSales = async (date) => {
    setLoading(true);
    try {
      const { data } = await salesApi.getDetailedReport(date);
      setDetailedSales(data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const totals = dailyStats.reduce((acc, curr) => ({
    revenue: acc.revenue + Number(curr.total_revenue),
    profit: acc.profit + Number(curr.total_profit),
    transactions: acc.transactions + Number(curr.total_transactions)
  }), { revenue: 0, profit: 0, transactions: 0 });

  const downloadBill = async (saleId) => {
    try {
      const response = await salesApi.downloadPDF(saleId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bill_${saleId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { alert('Bill file not found on server.'); }
  };

  const downloadExchangeBill = async (exchangeId) => {
    try {
      const response = await exchangeApi.downloadPDF(exchangeId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `exchange_${exchangeId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { alert('Exchange Voucher not found on server.'); }
  };

  const generateDailyPDF = () => {
    const doc = new jsPDF();
    const dateFormatted = new Date(selectedDate).toLocaleDateString(undefined, { dateStyle: 'long' });

    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('DAILY SALES REPORT', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`DATE: ${dateFormatted}`, 14, 30);
    doc.text(`GENERATED ON: ${new Date().toLocaleString()}`, 14, 35);

    const dayStat = dailyStats.find(s => s.sale_date === selectedDate) || {
      total_revenue: 0, total_profit: 0, total_transactions: 0
    };

    autoTable(doc, {
      startY: 45,
      head: [['Metric', 'Value']],
      body: [
        ['Total Transactions', `${dayStat.total_transactions}`],
        ['Gross Revenue', `LKR ${Number(dayStat.total_revenue).toLocaleString()}`],
        ['Estimated Profit', `LKR ${Number(dayStat.total_profit).toLocaleString()}`]
      ],
      theme: 'grid',
      headStyles: { fillStyle: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 12, cellPadding: 5 }
    });

    const tableData = detailedSales.map(sale => [
      `#${sale.id}`,
      new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sale.status === 'Exchange-Correction' ? `EXCHANGED: ${sale.exchange_info?.old_name} FOR ${sale.exchange_info?.new_name}` : sale.items.map(i => `${i.name} (x${i.quantity})`).join(', '),
      `LKR ${Number(sale.total_amount).toLocaleString()}`,
      sale.status
    ]);

    doc.setFontSize(14);
    doc.text('Individual Transactions', 14, doc.lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Invoice', 'Time', 'Items', 'Amount', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [52, 73, 94], textColor: 255 }
    });

    doc.save(`daily_report_${selectedDate}.pdf`);
  };

  // Journal Pagination Logic (Main List)
  const totalPages = Math.ceil(dailyStats.length / itemsPerPage);
  const currentDays = dailyStats.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Ledger Pagination Logic (Details List)
  const totalLedgerPages = Math.ceil(detailedSales.length / ledgerItemsPerPage);
  const currentLedgerItems = detailedSales.slice((ledgerPage - 1) * ledgerItemsPerPage, ledgerPage * ledgerItemsPerPage);

  if (selectedDate) {
    return (
      <div className="p-4 md:p-8">
        <SaleDetailsModal saleId={modalSaleId} onClose={() => setModalSaleId(null)} />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <button onClick={() => setSelectedDate(null)} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-bold transition-all group lg:text-lg">
            <ArrowLeft size={24} className="group-hover:-translate-x-1" />
            BACK TO SUMMARIES
          </button>
          <button onClick={generateDailyPDF} className="w-full md:w-auto bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-black flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95">
            <Printer size={20} /> DOWNLOAD FULL DAILY REPORT
          </button>
        </div>

        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-white mb-2 pt-4">Daily Ledger: {new Date(selectedDate).toLocaleDateString(undefined, { dateStyle: 'full' })}</h1>
            <p className="text-gray-400">Auditing {detailedSales.length} transactions (including exchanges)</p>
          </div>
          {totalLedgerPages > 1 && (
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest bg-gray-900 px-4 py-2 rounded-full border border-gray-800">
               Ledger Page {ledgerPage} of {totalLedgerPages}
            </span>
          )}
        </header>

        {loading ? (
          <div className="p-20 text-center text-gray-500 animate-pulse font-black tracking-widest uppercase">SYNCHRONIZING RECORDS...</div>
        ) : (
          <div className="space-y-4">
            {detailedSales.length === 0 ? (
              <div className="p-12 text-center text-gray-600 bg-gray-850 rounded-2xl border border-gray-800 italic">No sales recordings found.</div>
            ) : (
              currentLedgerItems.map(sale => (
                <div key={sale.id} className="bg-gray-850 p-6 rounded-2xl border border-gray-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-blue-500/50 transition-all">
                  <div className="flex items-center gap-6">
                    <div className={`${sale.status === 'Exchange-Correction' ? 'bg-purple-900/20 text-purple-400' : 'bg-blue-900/20 text-blue-400'} p-4 rounded-xl group-hover:scale-110 transition-transform`}>
                      {sale.status === 'Exchange-Correction' ? <RefreshCw size={28} /> : <Receipt size={28} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xl text-white">Invoice #{sale.id}</h4>
                        {sale.status !== 'Completed' && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            sale.status === 'Exchanged' ? 'bg-yellow-900/20 text-yellow-500 border border-yellow-800' : 'bg-purple-900/20 text-purple-400 border border-purple-800'
                          }`}>
                            {sale.status}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-1">
                        <p className="text-sm text-gray-500">{new Date(sale.created_at).toLocaleTimeString()}</p>
                        {sale.customer_name && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-900/10 px-2.5 py-1 rounded-lg border border-blue-900/30">
                            <User size={12} /> {sale.customer_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 w-full md:w-auto">
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 shadow-inner">
                      {sale.exchange_info && (
                        <div className="flex items-center justify-between p-2 mb-3 border-b border-gray-800 pb-4">
                          <div className="flex items-center gap-3">
                             <div className="flex items-center gap-2 bg-red-900/20 px-2 py-1 rounded border border-red-900/30">
                              <Package size={14} className="text-red-400" />
                              <span className="text-xs text-red-100 font-bold">{sale.exchange_info.old_name}</span>
                             </div>
                             <ArrowRight size={14} className="text-gray-600" />
                             <div className="flex items-center gap-2 bg-green-900/20 px-2 py-1 rounded border border-green-900/30">
                              <Package size={14} className="text-green-400" />
                              <span className="text-xs text-green-100 font-bold">{sale.exchange_info.new_name}</span>
                             </div>
                          </div>
                          
                          <button 
                            onClick={() => setModalSaleId(sale.status === 'Exchange-Correction' ? sale.exchange_info.original_sale_id : sale.exchange_info.new_sale_id)} 
                            className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border border-gray-700 flex items-center gap-2 transition-all active:scale-95"
                          >
                            <ExternalLink size={12} strokeWidth={3} className={sale.status === 'Exchange-Correction' ? 'text-yellow-500' : 'text-purple-500'} />
                            {sale.status === 'Exchange-Correction' ? 'View Origin Bill' : 'View Adj. Bill'}
                          </button>
                        </div>
                      )}
                      
                      {sale.status !== 'Exchange-Correction' && (
                        sale.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm py-2 border-b last:border-0 border-gray-800">
                            <span className="text-gray-400 font-medium">{item.name} <span className="text-blue-500 font-black ml-2 px-2 py-0.5 bg-blue-900/20 rounded-md">x{item.quantity}</span></span>
                            <span className="text-gray-200 font-mono">LKR {(item.selling_price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-8 self-end md:self-center">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 font-black uppercase mb-1 tracking-widest">
                        {sale.status === 'Exchange-Correction' ? 'Price Delta' : 'Transaction Total'}
                      </p>
                      <p className={`text-3xl font-black ${sale.total_amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        LKR {Number(sale.total_amount).toLocaleString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => (sale.status === 'Exchange-Correction' && sale.exchange_info) ? downloadExchangeBill(sale.exchange_info.id) : downloadBill(sale.id)} 
                      className="p-4 bg-gray-800 hover:bg-gray-700 text-blue-400 rounded-2xl border border-gray-700 transition-all active:scale-95 shadow-lg" 
                      title={sale.status === 'Exchange-Correction' ? "Download Exchange Voucher" : "Download Invoice"}
                    >
                      <Download size={24} />
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Pagination Controls logic same as before */}
            {totalLedgerPages > 1 && (
              <div className="mt-8 p-6 bg-gray-850 rounded-2xl border border-gray-800 flex justify-center items-center gap-6 shadow-2xl">
                <button disabled={ledgerPage === 1} onClick={() => setLedgerPage(prev => prev - 1)} className="p-3 rounded-xl bg-gray-800 text-gray-400 hover:text-blue-400 disabled:opacity-20 transition-all border border-gray-700 shadow-lg"><ChevronLeft size={24} /></button>
                <div className="flex gap-2">
                  {[...Array(totalLedgerPages)].map((_, i) => (
                    <button key={i + 1} onClick={() => setLedgerPage(i + 1)} className={`w-12 h-12 rounded-xl font-black text-sm transition-all border ${ledgerPage === i + 1 ? 'bg-green-600 text-white border-green-500' : 'bg-gray-900 text-gray-500 border-gray-800 hover:bg-gray-800 hover:text-white'}`}>
                      {i + 1}
                    </button>
                  )).filter((_, i) => {
                    return i === 0 || i === totalLedgerPages - 1 || Math.abs(i + 1 - ledgerPage) <= 1;
                  })}
                </div>
                <button disabled={ledgerPage === totalLedgerPages} onClick={() => setLedgerPage(prev => prev + 1)} className="p-3 rounded-xl bg-gray-800 text-gray-400 hover:text-blue-400 disabled:opacity-20 transition-all border border-gray-700 shadow-lg"><ChevronRight size={24} /></button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 underline decoration-blue-500 underline-offset-8">Financial Control Center</h1>
          <p className="text-sm text-gray-400">Comprehensive sales auditing and performance tracking</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative group">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-blue-500 transition-colors" size={20} />
            <input type="date" onChange={(e) => e.target.value && setSelectedDate(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer shadow-lg" title="Jump to date" />
          </div>
          <button onClick={fetchDailySummary} className="bg-gray-800 hover:bg-gray-700 text-blue-400 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-gray-700 shadow-lg">
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} /> REFRESH ENGINE
          </button>
        </div>
      </header>
      
      {/* Rest of the Stats logic same as before */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
        <div className="bg-gray-850 p-8 rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden group">
          <TrendingUp className="text-blue-600/10 absolute -right-4 -bottom-4 group-hover:scale-125 transition-transform duration-500" size={140} />
          <h3 className="text-gray-500 font-bold uppercase text-[10px] mb-4 tracking-widest">Total Cumulative Revenue</h3>
          <p className="text-4xl font-black text-white">LKR {Math.round(totals.revenue).toLocaleString()}</p>
        </div>
        <div className="bg-gray-850 p-8 rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden group">
          <DollarSign className="text-green-600/10 absolute -right-4 -bottom-4 group-hover:scale-125 transition-transform duration-500" size={140} />
          <h3 className="text-gray-500 font-bold uppercase text-[10px] mb-4 tracking-widest">Gross Merchant Profit</h3>
          <p className="text-4xl font-black text-green-400">LKR {Math.round(totals.profit).toLocaleString()}</p>
        </div>
        <div className="bg-gray-850 p-8 rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden group">
          <Calendar className="text-purple-600/10 absolute -right-4 -bottom-4 group-hover:scale-125 transition-transform duration-500" size={140} />
          <h3 className="text-gray-500 font-bold uppercase text-[10px] mb-4 tracking-widest">Lifetime Transactions</h3>
          <p className="text-4xl font-black text-white">{totals.transactions}</p>
        </div>
      </div>

      <div className="bg-gray-850 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col">
        <header className="px-8 py-6 border-b border-gray-800 bg-gray-800/30">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tighter">
              <Calendar size={24} className="text-blue-500" /> Daily Sales Journal
            </h2>
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Page {currentPage} of {totalPages || 1}</span>
          </div>
        </header>

        <div className="divide-y divide-gray-800 flex-1">
          {loading && dailyStats.length === 0 ? (
            <div className="p-20 text-center text-gray-500 animate-pulse font-bold tracking-widest uppercase">STREAMING JOURNAL ENTRIES...</div>
          ) : dailyStats.length === 0 ? (
            <div className="p-20 text-center text-gray-500 italic">No historical records found.</div>
          ) : currentDays.map((day) => {
            const dateStr = day.sale_date; 
            return (
              <div key={dateStr} onClick={() => setSelectedDate(dateStr)} className="p-6 flex items-center justify-between hover:bg-blue-900/10 transition-all cursor-pointer group active:bg-blue-900/20">
                <div className="flex items-center gap-6">
                  <div className="bg-gray-900 p-5 rounded-2xl text-gray-600 group-hover:text-blue-400 group-hover:bg-blue-900/30 group-hover:scale-110 transition-all shadow-inner"><Calendar size={28} /></div>
                  <div>
                    <h4 className="font-bold text-2xl text-white group-hover:text-blue-100 transition-colors">{new Date(day.sale_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</h4>
                    <p className="text-sm font-bold text-gray-500 bg-gray-900/50 w-fit px-3 py-1 rounded-full mt-1">{day.total_transactions} transactions completed</p>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-black uppercase mb-1 tracking-[0.2em]">Net Sales</p>
                    <p className="text-2xl font-black text-white group-hover:text-green-400 transition-colors">LKR {Math.round(day.total_revenue).toLocaleString()}</p>
                  </div>
                  <ChevronRight size={28} className="text-gray-700 group-hover:text-blue-500 group-hover:translate-x-2 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
        
        {totalPages > 1 && (
          <div className="p-6 bg-gray-800/20 border-t border-gray-800 flex justify-center items-center gap-6">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-3 rounded-xl bg-gray-800 text-gray-400 hover:text-blue-400 disabled:opacity-20 transition-all border border-gray-700 shadow-lg"><ChevronLeft size={24} /></button>
            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-12 h-12 rounded-xl font-black text-sm transition-all border ${currentPage === i + 1 ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-800 hover:text-white'}`}>
                  {i + 1}
                </button>
              )).filter((_, i) => {
                return i === 0 || i === totalPages - 1 || Math.abs(i + 1 - currentPage) <= 1;
              })}
            </div>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-3 rounded-xl bg-gray-800 text-gray-400 hover:text-blue-400 disabled:opacity-20 transition-all border border-gray-700 shadow-lg"><ChevronRight size={24} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
