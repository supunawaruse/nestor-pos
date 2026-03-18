import React, { useState, useEffect } from 'react';
import { Tag, Bookmark, Plus, Trash2, LayoutGrid, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { productApi } from '../api';

const MetaDataManagement = () => {
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newBrand, setNewBrand] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        productApi.getBrands(),
        productApi.getCategories()
      ]);
      setBrands(bRes.data);
      setCategories(cRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!newBrand) return;
    try {
      await productApi.createBrand(newBrand);
      setNewBrand('');
      setSuccess('Brand added successfully');
      fetchMetadata();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) { console.error(err); }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory) return;
    try {
      await productApi.createCategory(newCategory);
      setNewCategory('');
      setSuccess('Category added successfully');
      fetchMetadata();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-4 md:p-8">
      <header className="mb-12">
        <h1 className="text-3xl font-black text-white mb-2 underline decoration-blue-500 underline-offset-8">Structure Management</h1>
        <p className="text-gray-400 font-medium">Orchestrate your product brands and categories</p>
      </header>

      {success && (
        <div className="mb-8 bg-green-900/20 border border-green-500/50 p-4 rounded-xl flex items-center gap-3 text-green-400 animate-in fade-in slide-in-from-top-4">
          <CheckCircle size={20} /> <span className="font-bold uppercase text-xs">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Brands Section */}
        <section className="bg-gray-850 p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl relative overflow-hidden group">
          <Bookmark className="absolute -right-8 -bottom-8 text-blue-600/5 group-hover:scale-125 transition-transform duration-700" size={160} />
          <div className="relative z-10">
            <h2 className="text-xl font-black text-white flex items-center gap-3 mb-8 uppercase tracking-tighter">
              <Bookmark className="text-blue-500" /> Watch Brands
            </h2>
            
            <form onSubmit={handleAddBrand} className="flex gap-4 mb-8">
              <input 
                value={newBrand}
                onChange={e => setNewBrand(e.target.value)}
                placeholder="New Brand Name (e.g. Seiko)" 
                className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500 shadow-inner"
              />
              <button className="bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl text-white transition-all active:scale-95 shadow-lg">
                <Plus size={24} strokeWidth={3} />
              </button>
            </form>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {brands.map(brand => (
                <div key={brand.id} className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800 flex justify-between items-center group/item hover:border-blue-500/50 transition-all">
                  <span className="text-white font-bold">{brand.name}</span>
                  <Tag size={16} className="text-gray-700 group-hover/item:text-blue-500" />
                </div>
              ))}
              {brands.length === 0 && <p className="text-center text-gray-600 italic py-10">No brands registered yet.</p>}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="bg-gray-850 p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl relative overflow-hidden group">
          <LayoutGrid className="absolute -right-8 -bottom-8 text-purple-600/5 group-hover:scale-125 transition-transform duration-700" size={160} />
          <div className="relative z-10">
            <h2 className="text-xl font-black text-white flex items-center gap-3 mb-8 uppercase tracking-tighter">
              <LayoutGrid className="text-purple-500" /> Collection Categories
            </h2>
            
            <form onSubmit={handleAddCategory} className="flex gap-4 mb-8">
              <input 
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                placeholder="New Category (e.g. Luxury)" 
                className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500 shadow-inner"
              />
              <button className="bg-purple-600 hover:bg-purple-500 p-4 rounded-2xl text-white transition-all active:scale-95 shadow-lg">
                <Plus size={24} strokeWidth={3} />
              </button>
            </form>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {categories.map(cat => (
                <div key={cat.id} className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800 flex justify-between items-center group/item hover:border-purple-500/50 transition-all">
                  <span className="text-white font-bold">{cat.name}</span>
                  <LayoutGrid size={16} className="text-gray-700 group-hover/item:text-purple-500" />
                </div>
              ))}
              {categories.length === 0 && <p className="text-center text-gray-600 italic py-10">No categories defined yet.</p>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MetaDataManagement;
