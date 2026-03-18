import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Package, BarChart3, Menu, X, RefreshCw, Receipt, Settings, LayoutGrid } from 'lucide-react';
import PosScreen from './pages/PosScreen';
import ProductManagement from './pages/ProductManagement';
import Reports from './pages/Reports';
import Exchanges from './pages/Exchanges';
import Invoices from './pages/Invoices';
import MetaDataManagement from './pages/MetaDataManagement';
import { CartProvider } from './context/CartContext';

const SidebarLink = ({ to, icon: Icon, label, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 transition-colors ${isActive
        ? 'bg-blue-600/20 text-blue-400 border-r-4 border-blue-600 font-bold'
        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );
};

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <CartProvider>
      <Router>
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-900 text-gray-100">

          {/* Mobile Header */}
          <header className="md:hidden bg-gray-950 border-b border-gray-800 p-4 flex justify-between items-center sticky top-0 z-50">
            <h1 className="text-lg font-bold text-blue-400 flex items-center gap-2">
              <Package size={20} />
              <span>Nestor Works</span>
            </h1>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-400">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </header>

          {/* Sidebar (Desktop & Mobile Overlay) */}
          <aside className={`
            ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            fixed md:sticky md:top-0 md:self-start md:h-screen z-40 w-64 bg-gray-950 border-r border-gray-800 flex flex-col transition-transform duration-300 ease-in-out flex-shrink-0
          `}>
            <div className="hidden md:flex p-6 border-b border-gray-800">
              <h1 className="text-xl font-black text-blue-400 flex items-center gap-2 tracking-tighter">
                <Package size={24} />
                <span>Nestor Works POS</span>
              </h1>
            </div>

            <nav className="flex-1 mt-4">
              <SidebarLink to="/" icon={ShoppingCart} label="POS Screen" onClick={() => setIsMenuOpen(false)} />
              <SidebarLink to="/exchanges" icon={RefreshCw} label="Exchanges" onClick={() => setIsMenuOpen(false)} />
              <SidebarLink to="/products" icon={Package} label="Inventory" onClick={() => setIsMenuOpen(false)} />
              <SidebarLink to="/reports" icon={BarChart3} label="Analytics" onClick={() => setIsMenuOpen(false)} />
              <SidebarLink to="/invoices" icon={Receipt} label="Bills Hub" onClick={() => setIsMenuOpen(false)} />
              <SidebarLink to="/metadata" icon={LayoutGrid} label="Taxonomy" onClick={() => setIsMenuOpen(false)} />
            </nav>

            <div className="p-4 border-t border-gray-800 text-[10px] text-gray-600 text-center">
              Nestor Works POS &bull; v1.0
            </div>
          </aside>

          {/* Mobile Overlay Backdrop */}
          {isMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
            />
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-gray-900 w-full">
            <Routes>
              <Route path="/" element={<PosScreen />} />
              <Route path="/products" element={<ProductManagement />} />
              <Route path="/metadata" element={<MetaDataManagement />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/exchanges" element={<Exchanges />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </main>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
