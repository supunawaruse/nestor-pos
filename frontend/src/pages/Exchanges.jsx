import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, ArrowRight, Receipt, CheckCircle, XCircle, History, Package, User, Printer, Trash2 } from 'lucide-react';
import { salesApi, productApi, exchangeApi } from '../api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Exchanges = () => {
  const [saleId, setSaleId] = useState('');
  const [saleData, setSaleData] = useState(null);
  const [selectedOldProduct, setSelectedOldProduct] = useState(null);
  const [newProductSearch, setNewProductSearch] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedNewProduct, setSelectedNewProduct] = useState(null);
  const [exchangeLogs, setExchangeLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchLogs();
    fetchAllProducts();
  }, []);

  const fetchAllProducts = async () => {
    try {
      const { data } = await productApi.getAll(1, 0, true);
      setAllProducts(data);
    } catch (err) { console.error(err); }
  };

  const fetchLogs = async () => {
    try {
      const { data } = await exchangeApi.getAll();
      setExchangeLogs(data);
    } catch (err) { console.error(err); }
  };

  const handleSearchSale = async (e) => {
    e.preventDefault();
    if (!saleId) return;
    setLoading(true);
    try {
      // We can use detailed report as it includes items
      const { data } = await salesApi.getDetailedReport();
      const found = data.find(s => s.id === parseInt(saleId));
      
      if (!found) {
        setMessage({ type: 'error', text: 'Original Invoice not found!' });
        setSaleData(null);
      } else {
        // Check 7 day warranty
        const saleDate = new Date(found.created_at);
        const now = new Date();
        const diffDays = Math.ceil((now - saleDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 7) {
          setMessage({ type: 'warning', text: `Warranty expired (${diffDays} days ago). System allows but proceed with caution.` });
        }
        setSaleData(found);
        setMessage(null);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleProductSearch = (val) => {
    setNewProductSearch(val);
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }
    const filtered = allProducts.filter(p => 
      p.name.toLowerCase().includes(val.toLowerCase()) || 
      p.barcode.toLowerCase().includes(val.toLowerCase())
    ).slice(0, 5);
    setSearchResults(filtered);
  };

  const generateExchangePDF = (exchangeId, oldP, newP, custName, priceDiff) => {
    const doc = new jsPDF();
    const date = new Date().toLocaleString();

    doc.setFontSize(22);
    doc.text('EXCHANGE VOUCHER', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Exchange ID: EX-${exchangeId}`, 15, 30);
    doc.text(`Original Sale ID: #${saleId}`, 15, 35);
    doc.text(`Customer: ${custName || 'Walk-in'}`, 15, 40);
    doc.text(`Date & Time: ${date}`, 15, 45);

    doc.setFontSize(14);
    doc.text('1. RETURNED ITEM', 15, 60);
    autoTable(doc, {
      startY: 65,
      head: [['Product Code', 'Product Name', 'Credit Value']],
      body: [[oldP.barcode || 'N/A', oldP.name, `LKR ${Number(oldP.selling_price).toLocaleString()}`]],
      theme: 'grid',
      headStyles: { fillColor: [192, 57, 43] }
    });

    doc.text('2. REPLACEMENT ITEM', 15, doc.lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Product Code', 'Product Name', 'New Price']],
      body: [[newP.barcode, newP.name, `LKR ${Number(newP.selling_price).toLocaleString()}`]],
      theme: 'grid',
      headStyles: { fillColor: [39, 174, 96] }
    });

    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(16);
    doc.text(`PRICE DIFFERENCE: LKR ${priceDiff.toLocaleString()}`, 195, finalY, { align: 'right' });
    
    doc.setFontSize(10);
    doc.text('This is a "Changed Bill" replacing items on original receipt.', 105, finalY + 15, { align: 'center' });
    doc.text('Thank you for shopping at Nestor Works!', 105, finalY + 25, { align: 'center' });

    const pdfBase64 = doc.output('datauristring').split(',')[1];
    exchangeApi.savePDF(exchangeId, pdfBase64).catch(err => console.error('Failed to save exchange PDF:', err));

    doc.save(`exchange_${exchangeId}.pdf`);
  };

  const handleProcessExchange = async () => {
    if (!selectedOldProduct || !selectedNewProduct) return;

    setLoading(true);
    try {
      const { data } = await exchangeApi.create({
        original_sale_id: saleData.id,
        returned_product_id: selectedOldProduct.id,
        new_product_id: selectedNewProduct.id,
        qty: 1
      });

      setMessage({ type: 'success', text: 'Exchange processed! Stock updated.' });
      generateExchangePDF(data.exchangeId, selectedOldProduct, selectedNewProduct, saleData.customer_name, data.priceDifference);
      
      // Reset state
      setSaleData(null);
      setSaleId('');
      setSelectedOldProduct(null);
      setSelectedNewProduct(null);
      fetchLogs();
    } catch (err) {
      setMessage({ type: 'error', text: 'Exchange failed. Check system logs.' });
    } finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-8">
      <header className="mb-12">
        <h1 className="text-3xl font-black text-white mb-2 underline decoration-purple-500 underline-offset-8">Product Exchange Center</h1>
        <p className="text-gray-400">Manage 7-day watch returns and replacements</p>
      </header>

      {message && (
        <div className={`mb-8 p-6 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 ${
          message.type === 'success' ? 'bg-green-600/20 border border-green-500/50 text-green-400' : 
          message.type === 'warning' ? 'bg-yellow-600/20 border border-yellow-500/50 text-yellow-400' :
          'bg-red-600/20 border border-red-500/50 text-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle size={24}/> : <XCircle size={24}/>}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Action Area */}
        <section className="space-y-6">
          <div className="bg-gray-850 p-6 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden relative group">
            <h3 className="text-gray-500 font-bold uppercase text-[10px] mb-6 tracking-widest">Step 1: Identify Original Invoice</h3>
            <form onSubmit={handleSearchSale} className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input 
                  type="number" 
                  value={saleId} 
                  onChange={e => setSaleId(e.target.value)}
                  placeholder="Enter Invoice ID (e.g. 42)" 
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-purple-500 transition-all outline-none"
                />
              </div>
              <button disabled={loading} type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl font-black shadow-lg transition-all active:scale-95 disabled:opacity-50">
                {loading ? 'Searching...' : 'LOAD BILL'}
              </button>
            </form>

            {saleData && (
              <div className="mt-8 pt-8 border-t border-gray-800 animate-in fade-in duration-500">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="font-bold text-white text-lg">Items in Invoice #{saleData.id}</h4>
                    <p className="text-xs text-gray-500">{new Date(saleData.created_at).toLocaleString()}</p>
                    <p className="text-xs font-bold text-purple-400 mt-1 uppercase tracking-widest">{saleData.customer_name || 'Anonymous Customer'}</p>
                  </div>
                  <div className="bg-purple-900/20 px-3 py-1 rounded-full text-[10px] font-black text-purple-400 border border-purple-900/50">WARRANTY ACTIVE</div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Select Item to RETURN</p>
                  {saleData.items.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => !item.is_already_returned && setSelectedOldProduct(item)} 
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center ${
                      item.is_already_returned ? 'border-gray-800 bg-gray-950/20 opacity-50 cursor-not-allowed' :
                      selectedOldProduct?.id === item.id ? 'border-red-500 bg-red-900/10' : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'
                    }`}>
                      <div className="flex items-center gap-4">
                        <Package size={20} className={item.is_already_returned ? "text-gray-800" : "text-gray-500"} />
                        <div>
                          <p className="font-bold text-white text-sm">{item.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase">Paid LKR {Number(item.selling_price).toLocaleString()}</p>
                          {item.is_already_returned && <p className="text-[10px] text-red-500 font-black mt-1 tracking-tighter">ALREADY EXCHANGED</p>}
                        </div>
                      </div>
                      <button 
                        disabled={item.is_already_returned}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOldProduct(item);
                        }} 
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                          item.is_already_returned ? 'bg-gray-800 text-gray-600' :
                          selectedOldProduct?.id === item.id ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 group-hover:bg-red-900'
                        }`}
                      >
                        {item.is_already_returned ? 'Exchanged' : selectedOldProduct?.id === item.id ? 'Selected' : 'Return This'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selectedOldProduct && (
            <div className="bg-gray-850 p-6 rounded-3xl border border-gray-800 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-gray-500 font-bold uppercase text-[10px] mb-6 tracking-widest">Step 2: Select Replacement Item</h3>
              <div className="relative mb-6">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text" 
                  value={newProductSearch} 
                  onChange={e => handleProductSearch(e.target.value)}
                  placeholder="Search for New Watch..." 
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-green-500 transition-all outline-none"
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-gray-950 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-gray-800">
                    {searchResults.map(p => (
                      <div key={p.id} onClick={() => { setSelectedNewProduct(p); setSearchResults([]); setNewProductSearch(p.name); }} className="p-4 hover:bg-green-600/10 cursor-pointer flex justify-between items-center transition-all">
                        <div><p className="font-bold text-white text-sm">{p.name}</p><p className="text-xs text-gray-500">{p.brand} | Stock: {p.stock_quantity}</p></div>
                        <p className="font-black text-green-400 text-sm">LKR {Number(p.selling_price).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedNewProduct && (
                <div className="p-6 bg-gray-900/80 rounded-2xl border-2 border-green-500/20 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-red-900/20 rounded-xl text-red-400 line-through decoration-white/20"><Package size={20}/></div>
                      <ArrowRight className="text-gray-600" />
                      <div className="p-3 bg-green-900/20 rounded-xl text-green-400"><CheckCircle size={20}/></div>
                    </div>
                    <p className="text-xs text-gray-500 italic mb-1 uppercase tracking-widest font-black">Exchange Payload</p>
                    <p className="font-bold text-white text-lg">{selectedOldProduct.name} <ArrowRight className="inline mx-2 text-purple-500" size={16}/> {selectedNewProduct.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Price Difference</p>
                    <p className={`text-2xl font-black ${selectedNewProduct.selling_price - selectedOldProduct.selling_price >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      LKR {Math.abs(selectedNewProduct.selling_price - selectedOldProduct.selling_price).toLocaleString()}
                      <span className="text-[10px] ml-2 font-bold uppercase tracking-tighter antialiased">
                        {selectedNewProduct.selling_price - selectedOldProduct.selling_price >= 0 ? '(To Collect)' : '(Refundable)'}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              <button 
                onClick={handleProcessExchange}
                disabled={!selectedNewProduct || loading}
                className="w-full mt-6 bg-green-600 hover:bg-green-500 text-white py-5 rounded-2xl font-black text-xl shadow-2xl transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3"
              >
                <RefreshCw className={loading ? 'animate-spin' : ''} size={24} /> CONFIRM EXCHANGE & RE-PRINT
              </button>
            </div>
          )}
        </section>

        {/* Right: History Area */}
        <section className="bg-gray-850 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col">
          <header className="px-8 py-6 border-b border-gray-800 bg-gray-800/30 flex justify-between items-center">
            <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tighter">
              <History size={24} className="text-purple-500" /> Exchange Transaction Journal
            </h2>
          </header>
          
          <div className="flex-1 overflow-y-auto divide-y divide-gray-800">
            {exchangeLogs.length === 0 ? (
              <div className="p-20 text-center text-gray-600 opacity-20"><History size={48} className="mx-auto mb-4" /><p className="font-black uppercase tracking-widest">Awaiting Log History</p></div>
            ) : exchangeLogs.map(log => (
              <div key={log.id} className="p-6 hover:bg-white/5 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-900/20 rounded-xl text-purple-400"><Receipt size={20}/></div>
                    <div>
                      <h4 className="font-bold text-white">Exchange EX-{log.id}</h4>
                      <p className="text-[10px] text-gray-500 uppercase font-black">Linked to Bill #{log.original_sale_id}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600">{new Date(log.created_at).toLocaleDateString()}</span>
                </div>
                
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 space-y-3">
                   <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Return:</span>
                    <span className="text-red-400 font-bold">{log.old_product_name}</span>
                   </div>
                   <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Upgrade:</span>
                    <span className="text-green-400 font-bold">{log.new_product_name}</span>
                   </div>
                   <div className="pt-2 border-t border-gray-800 flex justify-between items-center text-sm">
                    <span className="text-gray-400 font-bold">Delta:</span>
                    <span className="font-black text-white">LKR {Number(log.price_difference).toLocaleString()}</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Exchanges;
