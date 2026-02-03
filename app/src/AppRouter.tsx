
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import ProductsPage from './pages/Products';
import TableStatus from './pages/TableStatus';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AdminProductManager from './pages/AdminProductManager';
import AdminOrders from './pages/AdminOrders';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/table-status" element={<TableStatus />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/products" element={<AdminProductManager />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
