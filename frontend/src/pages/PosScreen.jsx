import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, Trash2, CheckCircle, Barcode, XCircle, User, Phone, MapPin, StickyNote, ClipboardList, Shield } from 'lucide-react';
import { productApi, salesApi, userApi } from '../api';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useCart } from '../context/CartContext';

const PosScreen = () => {
  const [barcode, setBarcode] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const { cart, addToCart: addItem, removeFromCart, clearCart, calculateTotal } = useCart();
  const [message, setMessage] = useState(null);
  const barcodeInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Customer Info Modal
  const [showModal, setShowModal] = useState(false);
  const [customer, setCustomer] = useState({
    name: '',
    mobile: '',
    address: '',
    notes: ''
  });
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    fetchAllProducts();
    fetchUsers();
    barcodeInputRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'F8' && !showModal) {
        e.preventDefault();
        if (cart.length > 0) setShowModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, showModal]);

  const fetchAllProducts = async () => {
    try {
      // Get all products once for fast local POS search
      const { data } = await productApi.getAll(1, 0, true);
      setAllProducts(data);
    } catch (err) { console.error(err); }
  };
  const fetchUsers = async () => {
    try {
      const { data } = await userApi.getAll();
      setUsers(data);
    } catch (err) { console.error(err); }
  };

  const generateBill = (saleId, soldItems, cust) => {
    try {
      const doc = new jsPDF();
      const total = soldItems.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0);
      const date = new Date().toLocaleString();

      doc.setFontSize(22);
      doc.setTextColor(0, 0, 0);
      doc.text('NESTOR WORKS POS', 105, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Invoice ID: ${saleId}`, 15, 30);
      doc.text(`Date & Time: ${date}`, 15, 35);

      // Customer Info Section
      if (cust.name || cust.mobile) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('BILL TO:', 15, 45);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Name: ${cust.name || 'N/A'}`, 15, 50);
        doc.text(`Mobile: ${cust.mobile || 'N/A'}`, 15, 55);
        if (cust.address) doc.text(`Address: ${cust.address}`, 15, 60);
      }

      const tableStartY = (cust.name || cust.mobile) ? 70 : 45;

      const tableData = soldItems.map(item => [
        item.name,
        item.quantity,
        `LKR ${Number(item.selling_price).toFixed(2)}`,
        `LKR ${(item.selling_price * item.quantity).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: tableStartY,
        head: [['Product', 'Qty', 'Unit Price', 'Subtotal']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [0, 0, 0] }
      });

      const finalY = (doc.lastAutoTable?.finalY) || (tableStartY + 20);
      doc.setFontSize(16);
      doc.text(`GRAND TOTAL: LKR ${total.toFixed(2)}`, 195, finalY + 10, { align: 'right' });

      if (cust.notes) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Notes: ${cust.notes}`, 15, finalY + 15);
      }

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Thank you for shopping at Nestor Works!', 105, finalY + 25, { align: 'center' });

      doc.save(`bill_${saleId}.pdf`);
      return doc.output('datauristring').split(',')[1];
    } catch (err) {
      console.error('PDF Processing Error:', err);
      throw err;
    }
  };

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    try {
      const { data: product } = await productApi.getByBarcode(barcode);
      addItem(product);
      setBarcode('');
      setMessage({ type: 'success', text: `Added ${product.name}` });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Product not found!' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleNameSearch = (e) => {
    const value = e.target.value;
    setNameSearch(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (value.length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(() => {
      const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(value.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(value.toLowerCase()))
      ).slice(0, 5);
      setSearchResults(filtered);
    }, 150);
  };

  const selectProductFromSearch = (product) => {
    addItem(product);
    setNameSearch('');
    setSearchResults([]);
    setMessage({ type: 'success', text: `Added ${product.name}` });
    setTimeout(() => setMessage(null), 2000);
    barcodeInputRef.current?.focus();
  };

  const handleFinalCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const soldItems = [...cart];
      const saleData = {
        items: cart.map(it => ({
          productId: it.id,
          quantity: it.quantity,
          selling_price: it.selling_price,
          cost_price: it.cost_price
        })),
        customer_name: customer.name,
        customer_mobile: customer.mobile,
        customer_address: customer.address,
        notes: customer.notes,
        sold_by: selectedUserId
      };
      
      const { data } = await salesApi.createSale(saleData);
      const saleId = data.saleId;

      setShowModal(false);
      clearCart();
      setCustomer({ name: '', mobile: '', address: '', notes: '' });
      setMessage({ type: 'success', text: 'Checkout successful! Bill downloaded.' });
      setTimeout(() => setMessage(null), 5000);

      try {
        const base64 = generateBill(saleId, soldItems, customer);
        await salesApi.savePDF(saleId, base64);
      } catch (pdfErr) { console.error('PDF Processing Error:', pdfErr); }

    } catch (err) {
      console.error('Checkout Error:', err);
      setMessage({ type: 'error', text: 'Checkout failed!' });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <div className="p-4 md:p-8 pb-32 h-screen flex flex-col relative">
      {/* Customer Information Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-850 border border-gray-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <header className="bg-gray-800 p-6 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-black text-white flex items-center gap-3">
                <ClipboardList className="text-blue-500" /> Payment Collection
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <XCircle size={28} />
              </button>
            </header>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block">Customer Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                    <input
                      autoFocus
                      type="text"
                      value={customer.name}
                      onChange={e => setCustomer({ ...customer, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                    <input
                      type="text"
                      value={customer.mobile}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, ''); // Numeric only
                        setCustomer({ ...customer, mobile: val });
                      }}
                      placeholder="e.g. 0771234567"
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block">Customer Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-gray-600" size={18} />
                  <textarea
                    value={customer.address}
                    onChange={e => setCustomer({ ...customer, address: e.target.value })}
                    placeholder="Enter full delivery/billing address..."
                    rows={2}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pt-3 pb-3 pl-12 pr-4 text-white focus:border-blue-500 transition-all outline-none resize-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block">Sales Operative</label>
                <div className="relative group">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500" size={18} />
                  <select
                    required
                    value={selectedUserId}
                    onChange={e => setSelectedUserId(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-blue-500 transition-all outline-none appearance-none"
                  >
                    <option value="">Select Staff Member</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block">Internal Sales Notes</label>
                <textarea
                  value={customer.notes}
                  onChange={e => setCustomer({ ...customer, notes: e.target.value })}
                  placeholder="Warranty details, special requests, discount reasons..."
                  rows={2}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 px-4 text-white focus:border-blue-500 transition-all outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-750 text-white font-bold py-4 rounded-2xl transition-all active:scale-95"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    if (!customer.name.trim()) return alert("Customer name is required for warranty tracking.");
                    if (!customer.mobile.trim()) return alert("Mobile number is required for digital receipts.");
                    if (customer.mobile.length < 9) return alert("Please enter a valid mobile number.");
                    if (!selectedUserId) return alert("Please select the staff member who processed this sale.");
                    handleFinalCheckout();
                  }}
                  className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/40 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <CheckCircle size={24} /> CONFIRM & PRINT BILL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">POS Billing Terminal</h1>
          <p className="text-sm text-gray-400">Streamlined checkout and customer profiling</p>
        </div>
        {message && (
          <div className={`${message.type === 'error' ? 'bg-red-900 border-red-700' : 'bg-green-900 border-green-700'} border px-4 py-2 md:px-6 md:py-3 rounded-lg flex items-center gap-2 animate-bounce flex-shrink-0`}>
            {message.type === 'error' ? '⚠️' : <CheckCircle className="text-green-400" size={18} />}
            <span className="text-sm md:font-medium text-white">{message.text}</span>
          </div>
        )}
      </header>

      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 flex-1 overflow-y-auto lg:overflow-hidden">
        {/* Left Panel - Expanded for better visibility */}
        <section className="w-full lg:w-[800px] flex flex-col flex-shrink-0">
          <div className="space-y-4 mb-6">
            <div className="bg-gray-850 p-4 rounded-2xl border border-gray-800 shadow-xl">
              <form onSubmit={handleBarcodeSubmit} className="relative">
                <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={24} />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan Barcode (F8 to Finish)"
                  className="w-full pl-14 pr-4 py-3 bg-gray-900 border-2 border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-lg font-mono text-white transition-all shadow-inner"
                />
              </form>
            </div>

            <div className="bg-gray-850 p-4 rounded-2xl border border-gray-800 shadow-xl relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  value={nameSearch}
                  onChange={handleNameSearch}
                  placeholder="Search by Product Details..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-900 border-2 border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white transition-all shadow-inner"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border-2 border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-gray-800">
                  {searchResults.map(p => (
                    <div key={p.id} onClick={() => selectProductFromSearch(p)} className="p-4 hover:bg-blue-600/20 cursor-pointer flex justify-between items-center group transition-all">
                      <div><h4 className="font-bold text-white group-hover:text-blue-400">{p.name}</h4><p className="text-xs text-gray-500">{p.brand} | Stock: {p.stock_quantity}</p></div>
                      <div className="text-right"><p className="font-black text-blue-400">LKR {Number(p.selling_price).toLocaleString()}</p><p className="text-[10px] font-mono text-gray-600">{p.barcode}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 bg-gray-850 rounded-2xl border border-gray-800 shadow-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-800 bg-gray-800/30 flex justify-between font-bold text-gray-400 uppercase text-[10px] tracking-widest"><span className="flex-1">Order Details</span><span className="w-12 text-center">Net</span><span className="w-24 text-right">Value</span><span className="w-10"></span></div>
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-20"><ShoppingCart size={48} className="mb-4" /><p className="text-sm font-black uppercase tracking-widest italic">Awaiting Selection</p></div>
              ) : cart.map(item => (
                <div key={item.id} className="flex items-center p-4 border-b border-gray-800 hover:bg-gray-800/20 transition-all group">
                  <div className="flex-1 min-w-0"><h3 className="font-bold text-blue-100 truncate">{item.name}</h3><p className="text-[10px] text-gray-500 uppercase font-bold">{item.brand}</p></div>
                  <div className="w-12 text-center font-black text-lg text-white">{item.quantity}</div>
                  <div className="w-24 text-right font-black text-blue-400 text-sm">{(item.selling_price * item.quantity).toLocaleString()}</div>
                  <button onClick={() => removeFromCart(item.id)} className="w-10 text-gray-600 hover:text-red-500 transition-colors p-2 ml-2"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Panel */}
        <aside className="flex-1 flex flex-col bg-gray-850 rounded-2xl border border-gray-800 shadow-2xl p-6 overflow-hidden">
          <div className="flex-1 space-y-8">
            <div className="border-b border-gray-800 pb-6 flex justify-between items-end">
              <div><h2 className="text-lg font-black text-gray-500 uppercase tracking-widest mb-1">Checkout Summary</h2><p className="text-sm text-gray-600">Total items: {cart.length}</p></div>
              <button onClick={clearCart} disabled={cart.length === 0} className="text-[10px] font-black text-red-500 hover:text-red-400 disabled:text-gray-800 transition-colors uppercase tracking-[0.2em]">[ Flush Order ]</button>
            </div>

            <div className="py-6 text-center md:text-left">
              <span className="text-gray-600 font-black uppercase text-[10px] tracking-[0.2em] block mb-2">Total Amount Payable</span>
              <span className="text-4xl md:text-7xl font-black text-white/95 tracking-tighter">LKR {calculateTotal().toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-gray-900/50 border border-gray-800 rounded-3xl">
                <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-2">Checkout Logic</p>
                <div className="flex justify-between items-center text-xs font-bold text-gray-400"><span>Hotkey Pay</span><span className="px-3 py-1 bg-blue-900/20 text-blue-500 rounded-xl border border-blue-900/50">F8</span></div>
              </div>
              <div className="p-5 bg-gray-900/50 border border-gray-800 rounded-3xl">
                <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-2">Print Protocol</p>
                <div className="flex justify-between items-center text-xs font-bold text-green-500"><span>PDF Auto-Save</span><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span></div>
              </div>
            </div>
          </div>

          <button onClick={() => setShowModal(true)} disabled={cart.length === 0} className={`w-full py-5 mt-6 rounded-2xl font-black text-xl flex items-center justify-center gap-4 transition-all ${cart.length > 0 ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/40 active:scale-[0.98]' : 'bg-gray-800 text-gray-700 cursor-not-allowed opacity-50'}`}>
            <ShoppingCart size={28} /> COLLECT PAYMENT
          </button>
        </aside>
      </div>
    </div>
  );
};

export default PosScreen;
