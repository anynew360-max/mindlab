import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Users,
  ShoppingBag,
  CalendarCheck,
  Edit3,
  Save,
  X,
  Camera,
  ShieldCheck,
  Search,
  ShoppingCart
} from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

function SidebarMenuItem({
  icon,
  label,
  active,
  onClick,
  badge
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-200 cursor-pointer text-left ${
        active
          ? 'bg-amber-500 text-[#181c2a] font-bold shadow-md shadow-amber-500/20'
          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
      }`}
    >
      <span className="w-6 h-6 flex items-center justify-center">{icon}</span>
      <span className="text-base">{label}</span>
      {typeof badge === 'number' && badge > 0 && (
        <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
          {badge}
        </span>
      )}
    </button>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, loading: authLoading } = useAuth();
  const apiBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');
  const apiUrl = (path: string) => `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
  const [users, setUsers] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    orders: 0,
    products: 0,
    activeReservations: 0,
  });
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncAuthLoading, setSyncAuthLoading] = useState(false);
  const [syncAuthMessage, setSyncAuthMessage] = useState<string | null>(null);

  // Check admin and load users
  useEffect(() => {
    if (authLoading) return;
    if (!authUser || !authUser.isAdmin) {
      navigate('/');
      return;
    }

    let interval: ReturnType<typeof setInterval> | undefined;

    const loadUsers = async () => {
      if (!isFirebaseConfigured) {
        const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
        setUsers(mockUsers);
        return;
      }

      try {
        const response = await fetch(apiUrl('/api/users'));
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load users');
        }
        setUsers(Array.isArray(data.users) ? data.users : []);
      } catch (error) {
        console.error('Failed to load users:', error);
        setUsers(authUser ? [{ id: authUser.id, ...authUser }] : []);
      }
    };

    loadUsers();
    interval = setInterval(loadUsers, 5000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authLoading, authUser, navigate]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    const loadSummary = async () => {
      if (!isFirebaseConfigured) {
        const storedOrders = localStorage.getItem('orders');
        const orders = storedOrders ? JSON.parse(storedOrders) : [];
        const storedProducts = localStorage.getItem('products');
        const products = storedProducts ? JSON.parse(storedProducts) : [];
        const storedReservations = localStorage.getItem('table_reservations');
        const reservations = storedReservations ? JSON.parse(storedReservations) : [];
        const activeReservations = Array.isArray(reservations)
          ? reservations.filter((r: any) => r.status === 'active').length
          : 0;
        setSummary({
          orders: Array.isArray(orders) ? orders.length : 0,
          products: Array.isArray(products) ? products.length : 0,
          activeReservations,
        });
        return;
      }

      try {
        const response = await fetch(apiUrl('/api/dashboard-summary'));
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load summary');
        }
        setSummary({
          orders: data?.summary?.orders || 0,
          products: data?.summary?.products || 0,
          activeReservations: data?.summary?.activeReservations || 0,
        });
      } catch (error) {
        console.error('Failed to load summary:', error);
        setSummary({ orders: 0, products: 0, activeReservations: 0 });
      }
    };

    loadSummary();
    interval = setInterval(loadSummary, 5000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Handle edit
  const handleEdit = (idx: number) => {
    setEditIndex(idx);
    setEditData(users && typeof users[idx] === 'object' && users[idx] !== null ? Object.assign({}, users[idx]) : {});
  };

  const handleSave = async () => {
    if (editIndex === null) return;
    const updated = [...users];
    const next = { ...updated[editIndex], ...editData };
    updated[editIndex] = next;
    setUsers(updated);

    if (isFirebaseConfigured && next.id) {
      try {
        const response = await fetch(apiUrl('/api/update-user'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: next.id, updates: { ...editData } }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'Update failed');
        }
      } catch (error) {
        console.error('Failed to update user via API:', error);
      }
    } else {
      localStorage.setItem('mock_users', JSON.stringify(updated));
    }

    setEditIndex(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setEditData((prev: any) => ({ ...prev, profileImage: ev.target?.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSyncLocalData = async () => {
    if (!isFirebaseConfigured) {
      setSyncMessage('Firestore ยังไม่ได้ตั้งค่า');
      return;
    }

    setSyncing(true);
    setSyncMessage(null);
    try {
      const productsRaw = localStorage.getItem('products');
      const ordersRaw = localStorage.getItem('orders');
      const reservationsRaw = localStorage.getItem('table_reservations');

      const products = productsRaw ? JSON.parse(productsRaw) : [];
      const orders = ordersRaw ? JSON.parse(ordersRaw) : [];
      const reservations = reservationsRaw ? JSON.parse(reservationsRaw) : [];

      const response = await fetch(apiUrl('/api/sync-local-data'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products, orders, reservations }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Sync failed');
      }

      setSyncMessage('ซิงค์ข้อมูลจากเครื่องขึ้น Firestore สำเร็จ');
    } catch (err) {
      console.error('Failed to sync local data:', err);
      setSyncMessage(`ซิงค์ไม่สำเร็จ: ${(err as Error).message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncAuthUsers = async () => {
    if (!isFirebaseConfigured) {
      setSyncAuthMessage('Firestore ยังไม่ได้ตั้งค่า');
      return;
    }

    setSyncAuthLoading(true);
    setSyncAuthMessage(null);
    try {
      const response = await fetch(apiUrl('/api/sync-auth-users'), {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Sync failed');
      }
      setSyncAuthMessage(`ซิงค์ผู้ใช้จาก Firebase Auth สำเร็จ (${data.count || 0} คน)`);
    } catch (error) {
      console.error('Failed to sync auth users:', error);
      setSyncAuthMessage(`ซิงค์ผู้ใช้ไม่สำเร็จ: ${(error as Error).message}`);
    } finally {
      setSyncAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-amber-500/30 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-[#0f172a] border-r border-slate-800/70 flex flex-col h-screen fixed left-0 top-0 z-20 hidden md:flex">
        <div className="p-7 flex items-center gap-4 border-b border-slate-800/70">
          <div className="bg-amber-500 rounded-xl w-11 h-11 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ShieldCheck size={26} className="text-[#181c2a]" />
          </div>
          <span className="text-amber-500 font-bold text-xl tracking-widest">ADMIN</span>
        </div>
        <nav className="flex-1 p-5 space-y-2.5">
          <SidebarMenuItem
            icon={<Users size={20} />}
            label="สมาชิก"
            active={location.pathname === '/admin' || location.pathname === '/dashboard'}
            onClick={() => navigate('/admin')}
          />
          <SidebarMenuItem
            icon={<ShoppingBag size={20} />}
            label="สินค้า"
            active={location.pathname === '/admin/products'}
            onClick={() => navigate('/admin/products')}
          />
          <SidebarMenuItem
            icon={<ShoppingCart size={20} />}
            label="คำสั่งซื้อ"
            active={location.pathname === '/admin/orders'}
            onClick={() => navigate('/admin/orders')}
            badge={summary.orders}
          />
          <SidebarMenuItem
            icon={<CalendarCheck size={20} />}
            label="จองโต๊ะ"
            active={location.pathname === '/table-status'}
            onClick={() => navigate('/table-status')}
          />
        </nav>
        <div className="p-5 border-t border-slate-800/70 mt-auto">
          <button
            className="flex items-center gap-3 text-slate-300 hover:text-white w-full px-5 py-3 rounded-xl hover:bg-slate-800/60 transition-colors"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={20} />
            <span className="text-base">กลับไปหน้าหลัก</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-72 relative z-10 px-6 py-6">
        <div className="max-w-[1100px] mx-auto w-full">
          {/* Header Section */}
          <header className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-start md:items-center mb-6 gap-3">
            <div className="flex items-center" />
            <div className="flex items-center gap-3 md:justify-center">
              <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <ShieldCheck className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
                <p className="text-slate-400 text-sm">จัดการข้อมูลระบบหลังบ้าน</p>
              </div>
            </div>
            <div className="flex md:justify-end">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleSyncAuthUsers}
                  disabled={syncAuthLoading}
                  className="bg-slate-800 text-white font-semibold shadow hover:bg-slate-700"
                >
                  {syncAuthLoading ? 'กำลังซิงค์ผู้ใช้...' : 'ซิงค์ผู้ใช้จาก Auth'}
                </Button>
                <Button
                  onClick={handleSyncLocalData}
                  disabled={syncing}
                  className="bg-amber-500 text-[#181c2a] font-bold shadow hover:bg-amber-400"
                >
                  {syncing ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลจากเครื่อง'}
                </Button>
              </div>
            </div>
          </header>
          {syncMessage && (
            <div className="mb-6 text-sm text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
              {syncMessage}
            </div>
          )}
          {syncAuthMessage && (
            <div className="mb-6 text-sm text-slate-200 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
              {syncAuthMessage}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[{
              label: 'สมาชิกทั้งหมด',
              value: users.length,
              icon: Users,
              color: 'text-blue-400',
              bg: 'bg-blue-400/10'
            }, {
              label: 'รายการสินค้า',
              value: summary.products,
              icon: ShoppingBag,
              color: 'text-amber-400',
              bg: 'bg-amber-400/10'
            }, {
              label: 'คิวจองโต๊ะ',
              value: summary.activeReservations,
              icon: CalendarCheck,
              color: 'text-emerald-400',
              bg: 'bg-emerald-400/10'
            }].map((stat, i) => (
            <div
              key={i}
              className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-lg hover:border-slate-700 transition-all"
            >
              <div>
                <p className="text-slate-400 text-xs mb-1">{stat.label}</p>
                <h3 className="text-xl font-bold text-white">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            ))}
          </div>

          {/* User Management Table */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              รายชื่อสมาชิก
            </h2>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="ค้นหาสมาชิก..."
                className="bg-slate-950 border border-slate-800 text-sm text-slate-300 rounded-full pl-10 pr-4 py-1.5 focus:outline-none focus:border-amber-500/50 w-56 transition-all"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="p-4 font-medium">Profile</th>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Email / Contact</th>
                  <th className="p-4 font-medium">Password</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      ไม่พบข้อมูลสมาชิก
                    </td>
                  </tr>
                ) : (
                  users.map((u: any, idx: number) => {
                    const isEditing = editIndex === idx;
                    return (
                      <tr
                        key={idx}
                        className={`group transition-colors ${isEditing ? 'bg-amber-500/5' : 'hover:bg-slate-800/50'}`}
                      >
                        {/* Avatar Column */}
                        <td className="p-4 align-middle">
                          <div className="relative w-10 h-10">
                            {isEditing ? (
                              <label className="cursor-pointer group relative block w-full h-full">
                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-500 shadow-lg shadow-amber-500/20">
                                  <img
                                    src={
                                      editData.profileImage ||
                                      u.profileImage ||
                                      'https://ui-avatars.com/api/?name=User&background=random'
                                    }
                                    className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-all"
                                    alt="Edit"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Camera className="w-4 h-4 text-white drop-shadow-md" />
                                  </div>
                                </div>
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                              </label>
                            ) : (
                              <img
                                src={
                                  u.profileImage ||
                                  `https://ui-avatars.com/api/?name=${u.name}&background=1e293b&color=cbd5e1`
                                }
                                alt="profile"
                                className="w-10 h-10 rounded-full object-cover border-2 border-slate-700 shadow-sm"
                              />
                            )}
                          </div>
                        </td>
                        {/* Name Column */}
                        <td className="p-4 align-middle">
                          {isEditing ? (
                            <input
                              className="bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-1.5 text-white w-full focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                              value={editData.name}
                              onChange={(e) => setEditData((prev: any) => ({ ...prev, name: e.target.value }))}
                            />
                          ) : (
                            <span className="font-semibold text-slate-200 text-sm">{u.name}</span>
                          )}
                        </td>
                        {/* Email Column */}
                        <td className="p-4 align-middle">
                          <span className="text-slate-400 font-mono text-xs">{u.email}</span>
                        </td>
                        {/* Password Column */}
                        <td className="p-4 align-middle">
                          {isEditing ? (
                            <input
                              className="bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-1.5 text-white w-full focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono"
                              value={editData.password}
                              onChange={(e) => setEditData((prev: any) => ({ ...prev, password: e.target.value }))}
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 text-[11px] bg-slate-950 px-2 py-1 rounded border border-slate-800 font-mono">
                                {u.password ? '••••••' : 'No Password'}
                              </span>
                            </div>
                          )}
                        </td>
                        {/* Actions Column */}
                        <td className="p-4 align-middle text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={handleSave}
                                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold h-8 w-8 p-0 rounded-full"
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditIndex(null)}
                                className="border-slate-600 text-slate-400 hover:text-white hover:bg-slate-800 h-8 w-8 p-0 rounded-full"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 transition-all"
                              onClick={() => handleEdit(idx)}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-950/30 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500">
              * Admin มีสิทธิ์แก้ไขข้อมูลสมาชิกได้ทันที โดยข้อมูลจะถูกบันทึกใน Firestore
            </p>
          </div>
        </div>

          {/* Summary Section */}
          <div className="w-full bg-gradient-to-br from-yellow-500/10 via-[#23263a] to-[#181c2a] rounded-2xl shadow-2xl p-5 md:p-6 border border-yellow-600/30 backdrop-blur-xl mt-6">
          <h2 className="text-xl md:text-2xl font-bold text-yellow-400 mb-4 text-center tracking-wide">สรุปข้อมูลเว็บ</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-[#10131c] rounded-xl p-4 border border-[#23263a] shadow text-yellow-400 font-semibold text-sm flex items-center justify-between">
              จำนวนสมาชิก: <span className="text-white font-bold text-xl">{users.length}</span>
            </div>
            <div className="flex-1 bg-[#10131c] rounded-xl p-4 border border-[#23263a] shadow text-yellow-400 font-semibold text-sm flex items-center justify-between">
              จำนวนสินค้า: <span className="text-white font-bold text-xl">{summary.products}</span>
            </div>
            <div className="flex-1 bg-[#10131c] rounded-xl p-4 border border-[#23263a] shadow text-yellow-400 font-semibold text-sm flex items-center justify-between">
              สถานะการจองโต๊ะ: <span className="text-white font-bold text-xl">{summary.activeReservations}</span>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
