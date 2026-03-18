import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, X, DollarSign, Tag, Hash, Bookmark, LayoutGrid, Clock, ShoppingBag } from 'lucide-react';
import { productApi } from '../api';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 8;

  // Filters
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [formData, setFormData] = useState({
    name: '',
    brand_id: '',
    category_id: '',
    barcode: '',
    buying_price: '',
    selling_price: '',
    stock_quantity: '',
  });

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, selectedBrand, selectedCategory, searchTerm]);

  const fetchMetadata = async () => {
    try {
      const [bRes, cRes] = await Promise.all([
        productApi.getBrands(),
        productApi.getCategories()
      ]);
      setBrands(bRes.data);
      setCategories(cRes.data);
    } catch (err) { console.error(err); }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await productApi.getAll(page, limit, false, searchTerm, selectedBrand, selectedCategory);
      setProducts(data.products);
      setTotalPages(Math.ceil(data.total / limit));
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productApi.update(editingProduct.id, formData);
      } else {
        await productApi.add(formData);
      }
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      alert('Error saving product');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', brand_id: '', category_id: '', barcode: '',
      buying_price: '', selling_price: '', stock_quantity: '',
    });
    setEditingProduct(null);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand_id: product.brand_id || '',
      category_id: product.category_id || '',
      barcode: product.barcode,
      buying_price: product.buying_price,
      selling_price: product.selling_price,
      stock_quantity: product.stock_quantity,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productApi.delete(id);
        fetchProducts();
      } catch (error) {
        alert('Error deleting product');
      }
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black text-white mb-2 underline decoration-blue-500 underline-offset-8">Inventory Engine</h1>
          <p className="text-sm text-gray-400 font-medium">Precision catalog management for high-end horology</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 w-full md:w-auto"
        >
          <Plus size={20} strokeWidth={3} /> INITIALIZE STOCK
        </button>
      </header>

      {/* Control Bar */}
      <div className="bg-gray-850 p-6 rounded-3xl border border-gray-800 shadow-2xl mb-12 flex flex-col md:flex-row gap-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search by Barcode or Watch Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all shadow-inner"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none cursor-pointer font-bold text-sm shadow-inner"
          >
            <option value="All">All Brands</option>
            {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none cursor-pointer font-bold text-sm shadow-inner"
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center text-gray-500 animate-pulse font-black uppercase tracking-widest">STREAMING CATALOG...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <div key={product.id} className="bg-gray-850 rounded- [2.5rem] border border-gray-800 shadow-2xl hover:border-blue-500/50 transition-all p-8 relative overflow-hidden group">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => handleEdit(product)} className="p-2 bg-gray-900/80 backdrop-blur-md rounded-lg text-blue-400 hover:text-white transition-all"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(product.id)} className="p-2 bg-gray-900/80 backdrop-blur-md rounded-lg text-red-400 hover:text-white transition-all"><Trash2 size={16} /></button>
                </div>

                <div className="mb-6 relative h-40 flex items-center justify-center bg-gray-900 rounded-3xl group-hover:bg-blue-900/10 transition-colors shadow-inner overflow-hidden">
                  <Package size={64} className="text-gray-700 group-hover:text-blue-500 group-hover:scale-110 transition-all" />
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-lg">#{product.id}</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{product.category_name}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{product.name}</h3>
                <p className="text-xs text-blue-400 font-black uppercase mb-6">{product.brand_name || 'Generic'}</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-900 rounded-2xl border border-gray-800">
                    <p className="text-[10px] text-gray-600 font-bold uppercase mb-1">Retail Price</p>
                    <p className="text-sm font-mono text-white">LKR {Number(product.selling_price).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-gray-900 rounded-2xl border border-gray-800">
                    <p className="text-[10px] text-gray-600 font-bold uppercase mb-1">Stock Level</p>
                    <p className={`text-sm font-mono font-black ${product.stock_quantity <= 5 ? 'text-red-500' : 'text-green-500'}`}>{product.stock_quantity} units</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-600 font-bold border-t border-gray-800 pt-4">
                  <Hash size={12} className="text-blue-500" /> {product.barcode}
                </div>
              </div>
            ))}
          </div>

          {/* Catalog Pagination Controls */}
          <div className="mt-12 p-6 bg-gray-850 rounded-3xl border border-gray-800 flex justify-center items-center gap-6 shadow-2xl">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-4 rounded-2xl bg-gray-800 text-gray-400 hover:text-blue-400 disabled:opacity-20 transition-all border border-gray-700 shadow-xl"><ChevronLeft size={24} strokeWidth={3} /></button>
            <div className="flex gap-3">
              {[...Array(totalPages)].map((_, i) => (
                <button key={i + 1} onClick={() => setPage(i + 1)} className={`w-14 h-14 rounded-2xl font-black text-sm transition-all border-2 ${page === i + 1 ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-900 text-gray-500 border-gray-800 hover:bg-gray-800 hover:text-white'}`}>
                  {i + 1}
                </button>
              )).filter((_, i) => {
                return i === 0 || i === totalPages - 1 || Math.abs(i + 1 - page) <= 1;
              })}
            </div>
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="p-4 rounded-2xl bg-gray-800 text-gray-400 hover:text-blue-400 disabled:opacity-20 transition-all border border-gray-700 shadow-xl"><ChevronRight size={24} strokeWidth={3} /></button>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <header className="px-10 py-8 bg-gray-850 border-b border-gray-800 flex justify-between items-center bg-gray-800/20 shrink-0">
              <h2 className="text-2xl font-black text-white flex items-center gap-4">
                <ShoppingBag className="text-blue-500" /> {editingProduct ? 'MODERNIZE PRODUCT' : 'INITIALIZE ASSET'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-3 hover:bg-white/10 rounded-full transition-all text-gray-600"><X /></button>
            </header>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSubmit} className="p-10">
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div className="col-span-2">
                    <label className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-2">Watch Model Identification</label>
                    <div className="relative group">
                      <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500" size={20} />
                      <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Rolex Submariner Date" className="w-full bg-gray-850 border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-blue-500 transition-all outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-2">Manufacturer Brand</label>
                    <div className="relative group">
                      <Bookmark className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500" size={20} />
                      <select required value={formData.brand_id} onChange={e => setFormData({ ...formData, brand_id: e.target.value })} className="w-full bg-gray-850 border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer">
                        <option value="">Select Brand</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-2">Collection Class</label>
                    <div className="relative group">
                      <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500" size={20} />
                      <select required value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} className="w-full bg-gray-850 border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-purple-500 transition-all outline-none appearance-none cursor-pointer">
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-3">Electronic Trace Code (Barcode)</label>
                    <div className="relative group">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500" size={20} />
                      <input required value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} placeholder="Scan or type unique barcode..." className="w-full bg-gray-850 border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-blue-500 transition-all outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-2">Acquisition Unit Cost</label>
                    <div className="relative group">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-500" size={20} />
                      <input required type="number" value={formData.buying_price} onChange={e => setFormData({ ...formData, buying_price: e.target.value })} placeholder="LKR Cost" className="w-full bg-gray-850 border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-white font-mono focus:border-green-500 transition-all outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-2">Point-of-Sale Pricing</label>
                    <div className="relative group">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500" size={20} />
                      <input required type="number" value={formData.selling_price} onChange={e => setFormData({ ...formData, selling_price: e.target.value })} placeholder="LKR Selling" className="w-full bg-gray-850 border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-white font-mono focus:border-blue-500 transition-all outline-none" />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-2">Operational Stock Reserve</label>
                    <div className="relative group">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500" size={20} />
                      <input required type="number" value={formData.stock_quantity} onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })} placeholder="Units in Reserve" className="w-full bg-gray-850 border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-blue-500 transition-all outline-none" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black transition-all active:scale-95 shadow-xl uppercase tracking-widest">
                    {editingProduct ? 'APPLY MODIFICATIONS' : 'DEPLOY ASSET'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="px-10 bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold py-5 rounded-2xl border border-gray-700 transition-all">CANCEL</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
