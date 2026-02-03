import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarCheck,
  ShoppingBag,
  ShoppingCart,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

type OrderItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type Order = {
  id: number;
  createdAt: string | { seconds: number } | null;
  status: 'pending' | 'paid' | 'shipped' | 'canceled';
  total: number;
  customer: {
    fullName: string;
    phone: string;
    address: string;
    note?: string;
  };
  items: OrderItem[];
  firestoreId?: string;
};

function formatDate(value: Order['createdAt']) {
  if (!value) return '-';
  if (typeof value === 'string') return new Date(value).toLocaleString('th-TH');
  if (typeof value === 'object' && 'seconds' in value) {
    return new Date(value.seconds * 1000).toLocaleString('th-TH');
  }
  return '-';
}

function SidebarMenuItem({
  icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: ReactNode;
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

export default function AdminOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    note: '',
    status: 'pending' as Order['status'],
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('auth_user') || 'null');
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const loadLocalOrders = () => {
      const stored = localStorage.getItem('orders');
      setOrders(stored ? JSON.parse(stored) : []);
    };

    if (!isFirebaseConfigured) {
      loadLocalOrders();
      const handler = () => loadLocalOrders();
      window.addEventListener('orders-updated', handler);
      window.addEventListener('storage', handler);
      return () => {
        window.removeEventListener('orders-updated', handler);
        window.removeEventListener('storage', handler);
      };
    }

    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        firestoreId: doc.id,
        ...(doc.data() as Order),
      }));
      setOrders(data);
    });

    return () => unsub();
  }, []);

  const beginEdit = (order: Order) => {
    setEditingId(order.id);
    setEditForm({
      fullName: order.customer?.fullName || '',
      phone: order.customer?.phone || '',
      address: order.customer?.address || '',
      note: order.customer?.note || '',
      status: order.status || 'pending',
    });
  };

  const persistLocalOrders = (next: Order[]) => {
    setOrders(next);
    localStorage.setItem('orders', JSON.stringify(next));
    window.dispatchEvent(new Event('orders-updated'));
  };

  const saveEdit = async (order: Order) => {
    const updatedOrder: Order = {
      ...order,
      status: editForm.status,
      customer: {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim(),
        address: editForm.address.trim(),
        note: editForm.note.trim(),
      },
    };

    if (isFirebaseConfigured && order.firestoreId) {
      try {
        await updateDoc(doc(db, 'orders', order.firestoreId), {
          status: updatedOrder.status,
          customer: updatedOrder.customer,
        });
      } catch (error) {
        console.error('Failed to update order in Firestore:', error);
      }
    }

    if (!isFirebaseConfigured) {
      const next = orders.map((o) => (o.id === order.id ? updatedOrder : o));
      persistLocalOrders(next);
    }

    setEditingId(null);
  };

  const handleDelete = async (order: Order) => {
    if (!confirm('ลบคำสั่งซื้อนี้หรือไม่?')) return;

    if (isFirebaseConfigured && order.firestoreId) {
      try {
        await deleteDoc(doc(db, 'orders', order.firestoreId));
      } catch (error) {
        console.error('Failed to delete order in Firestore:', error);
      }
    }

    if (!isFirebaseConfigured) {
      const next = orders.filter((o) => o.id !== order.id);
      persistLocalOrders(next);
    }
  };

  const totalOrders = orders.length;
  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + (order.total || 0), 0),
    [orders]
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-amber-500/30 flex">
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
            badge={totalOrders}
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

      <div className="flex-1 md:ml-72 relative z-10 px-6 py-6">
        <div className="max-w-[1200px] mx-auto w-full">
          <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">คำสั่งซื้อ</h1>
              <p className="text-slate-400 text-sm">รายการคำสั่งซื้อจากลูกค้า</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl px-4 py-2">
                <p className="text-xs text-slate-400">จำนวนคำสั่งซื้อ</p>
                <p className="text-lg font-bold text-amber-400">{totalOrders}</p>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl px-4 py-2">
                <p className="text-xs text-slate-400">ยอดรวม</p>
                <p className="text-lg font-bold text-emerald-400">฿{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </header>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-500" />
                รายการคำสั่งซื้อ
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                    <th className="p-4 font-medium">รหัส</th>
                    <th className="p-4 font-medium">ลูกค้า</th>
                    <th className="p-4 font-medium">ที่อยู่</th>
                    <th className="p-4 font-medium">รายการสินค้า</th>
                    <th className="p-4 font-medium">รวม</th>
                    <th className="p-4 font-medium">เวลา</th>
                    <th className="p-4 font-medium">สถานะ</th>
                    <th className="p-4 font-medium text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        ยังไม่มีคำสั่งซื้อ
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) =>
                      editingId === order.id ? (
                        <tr key={order.firestoreId || order.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-4 text-slate-300 font-semibold">#{order.id}</td>
                          <td className="p-4">
                            <input
                              value={editForm.fullName}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                              className="w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1 text-sm text-white"
                              placeholder="ชื่อ-สกุล"
                            />
                            <input
                              value={editForm.phone}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                              className="mt-2 w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1 text-sm text-white"
                              placeholder="เบอร์โทร"
                            />
                          </td>
                          <td className="p-4">
                            <textarea
                              value={editForm.address}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                              className="w-full min-h-[70px] rounded-md bg-slate-950 border border-slate-700 px-2 py-1 text-sm text-white"
                              placeholder="ที่อยู่"
                            />
                            <input
                              value={editForm.note}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, note: e.target.value }))}
                              className="mt-2 w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1 text-sm text-white"
                              placeholder="หมายเหตุ"
                            />
                          </td>
                          <td className="p-4">
                            <div className="text-slate-300 text-sm">{order.items?.length || 0} รายการ</div>
                            <div className="text-slate-500 text-xs line-clamp-2">
                              {order.items?.map((item) => `${item.name} x${item.quantity}`).join(', ') || '-'}
                            </div>
                          </td>
                          <td className="p-4 text-amber-400 font-semibold">฿{order.total?.toLocaleString?.() || 0}</td>
                          <td className="p-4 text-slate-400 text-sm">{formatDate(order.createdAt)}</td>
                          <td className="p-4">
                            <select
                              value={editForm.status}
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, status: e.target.value as Order['status'] }))
                              }
                              className="w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1 text-sm text-white"
                            >
                              <option value="pending">pending</option>
                              <option value="paid">paid</option>
                              <option value="shipped">shipped</option>
                              <option value="canceled">canceled</option>
                            </select>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => saveEdit(order)}
                                className="px-3 py-1.5 rounded-lg bg-amber-500 text-[#181c2a] text-sm font-semibold hover:bg-amber-400"
                              >
                                บันทึก
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800/70"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={order.firestoreId || order.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-4 text-slate-300 font-semibold">#{order.id}</td>
                          <td className="p-4">
                            <div className="text-white font-medium">{order.customer?.fullName || '-'}</div>
                            <div className="text-slate-400 text-sm">{order.customer?.phone || '-'}</div>
                          </td>
                          <td className="p-4 text-slate-300 text-sm max-w-[240px]">
                            {order.customer?.address || '-'}
                            {order.customer?.note && (
                              <div className="text-slate-500 text-xs mt-1">หมายเหตุ: {order.customer.note}</div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="text-slate-300 text-sm">{order.items?.length || 0} รายการ</div>
                            <div className="text-slate-500 text-xs line-clamp-2">
                              {order.items?.map((item) => `${item.name} x${item.quantity}`).join(', ') || '-'}
                            </div>
                          </td>
                          <td className="p-4 text-amber-400 font-semibold">฿{order.total?.toLocaleString?.() || 0}</td>
                          <td className="p-4 text-slate-400 text-sm">{formatDate(order.createdAt)}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400">
                              {order.status || 'pending'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => beginEdit(order)}
                                className="px-3 py-1.5 rounded-lg border border-amber-500/40 text-amber-400 text-sm hover:bg-amber-500/10"
                              >
                                แก้ไข
                              </button>
                              <button
                                onClick={() => handleDelete(order)}
                                className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 text-sm hover:bg-red-500/10"
                              >
                                ลบ
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
