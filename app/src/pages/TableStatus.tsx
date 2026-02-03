import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarCheck, ShoppingBag, Users, ShieldCheck, ArrowLeft, ShoppingCart } from 'lucide-react';
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

const defaultTables = [
  { id: 1, status: 'available' },
  { id: 2, status: 'available' },
  { id: 3, status: 'available' },
  { id: 4, status: 'available' },
  { id: 5, status: 'available' },
  { id: 6, status: 'available' },
];

function TableStatus() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tables, setTables] = useState(defaultTables);
  const [reservations, setReservations] = useState([] as Array<{
    id: number;
    tableId: number;
    name: string;
    phone: string;
    date: string;
    time: string;
    players: string;
    tableType: string;
    status: 'active' | 'canceled';
    firestoreId?: string;
    createdAt?: string | { seconds: number };
  }>);
  const [orderCount, setOrderCount] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    players: '',
    tableType: ''
  });

  useEffect(() => {
    const loadData = () => {
      const stored = localStorage.getItem('table_states');
      if (stored) setTables(JSON.parse(stored));
      const storedRes = localStorage.getItem('table_reservations');
      if (storedRes) setReservations(JSON.parse(storedRes));
    };

    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('table-reservation-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('table-reservation-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(db, 'table_reservations'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        firestoreId: d.id,
        ...(d.data() as any)
      }));
      setReservations(data);

      const activeTableIds = new Set(
        data.filter((r: any) => r.status === 'active').map((r: any) => r.tableId)
      );
      setTables(defaultTables.map((t) => ({ ...t, status: activeTableIds.has(t.id) ? 'reserved' : 'available' })));
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const loadOrders = () => {
      const storedOrders = localStorage.getItem('orders');
      const orders = storedOrders ? JSON.parse(storedOrders) : [];
      setOrderCount(Array.isArray(orders) ? orders.length : 0);
    };

    loadOrders();
    const handleUpdate = () => loadOrders();
    window.addEventListener('orders-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('orders-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('table_states', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem('table_reservations', JSON.stringify(reservations));
  }, [reservations]);

  const activeReservations = useMemo(
    () => reservations.filter((r) => r.status === 'active'),
    [reservations]
  );

  const getReservationTime = (r: typeof reservations[number]) => {
    if (typeof r.createdAt === 'string') return new Date(r.createdAt).getTime();
    if (r.createdAt && typeof r.createdAt === 'object' && 'seconds' in r.createdAt) {
      return r.createdAt.seconds * 1000;
    }
    return r.id;
  };

  const latestReservations = useMemo(
    () => [...activeReservations].sort((a, b) => getReservationTime(b) - getReservationTime(a)),
    [activeReservations]
  );

  const latestReservationByTable = useMemo(() => {
    const map = new Map<number, typeof reservations[number]>();
    for (const r of latestReservations) map.set(r.tableId, r);
    return map;
  }, [latestReservations, reservations]);

  const handleCancel = async (reservationId: number, tableId: number, firestoreId?: string) => {
    if (isFirebaseConfigured && firestoreId) {
      try {
        await updateDoc(doc(db, 'table_reservations', firestoreId), { status: 'canceled' });
      } catch (error) {
        console.error('Failed to cancel reservation in Firestore:', error);
      }
    }

    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: 'canceled' } : r))
    );
    setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, status: 'available' } : t)));
  };

  const beginEdit = (reservation: typeof reservations[number]) => {
    setEditingId(reservation.id);
    setEditForm({
      name: reservation.name,
      phone: reservation.phone,
      date: reservation.date,
      time: reservation.time,
      players: reservation.players,
      tableType: reservation.tableType
    });
  };

  const saveEdit = async (reservation: typeof reservations[number]) => {
    const updated = {
      ...reservation,
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      date: editForm.date,
      time: editForm.time,
      players: editForm.players,
      tableType: editForm.tableType
    };

    if (isFirebaseConfigured && reservation.firestoreId) {
      try {
        await updateDoc(doc(db, 'table_reservations', reservation.firestoreId), {
          name: updated.name,
          phone: updated.phone,
          date: updated.date,
          time: updated.time,
          players: updated.players,
          tableType: updated.tableType
        });
      } catch (error) {
        console.error('Failed to update reservation in Firestore:', error);
      }
    }

    setReservations((prev) => prev.map((r) => (r.id === reservation.id ? updated : r)));
    setEditingId(null);
  };

  const total = tables.length;
  const available = tables.filter(t => t.status === 'available').length;
  const reserved = total - available;
  return (
    <div className="min-h-screen bg-[#0f172a] font-sans text-slate-200 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-[#0f172a] border-r border-slate-800/70 flex flex-col h-screen fixed left-0 top-0 z-20 hidden md:flex">
        <div className="p-7 flex items-center gap-4 border-b border-slate-800/70">
          <div className="bg-amber-500 rounded-xl w-11 h-11 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ShieldCheck size={26} className="text-[#181c2a]" />
          </div>
          <span className="text-amber-500 font-bold text-xl tracking-widest">ADMIN</span>
        </div>
        <nav className="flex-1 p-5 space-y-2.5">
          <button
            onClick={() => navigate('/admin')}
            className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-200 cursor-pointer text-left ${
              location.pathname === '/admin'
                ? 'bg-amber-500 text-[#181c2a] font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <span className="w-6 h-6 flex items-center justify-center"><Users size={20} /></span>
            <span className="text-base">สมาชิก</span>
          </button>
          <button
            onClick={() => navigate('/admin/products')}
            className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-200 cursor-pointer text-left ${
              location.pathname === '/admin/products'
                ? 'bg-amber-500 text-[#181c2a] font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <span className="w-6 h-6 flex items-center justify-center"><ShoppingBag size={20} /></span>
            <span className="text-base">สินค้า</span>
          </button>
          <button
            onClick={() => navigate('/admin/orders')}
            className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-200 cursor-pointer text-left ${
              location.pathname === '/admin/orders'
                ? 'bg-amber-500 text-[#181c2a] font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <span className="w-6 h-6 flex items-center justify-center"><ShoppingCart size={20} /></span>
            <span className="text-base">คำสั่งซื้อ</span>
            {orderCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {orderCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/table-status')}
            className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-200 cursor-pointer text-left ${
              location.pathname === '/table-status'
                ? 'bg-amber-500 text-[#181c2a] font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <span className="w-6 h-6 flex items-center justify-center"><CalendarCheck size={20} /></span>
            <span className="text-base">จองโต๊ะ</span>
          </button>
        </nav>
        <div className="p-5 border-t border-slate-800/70 mt-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-slate-300 hover:text-white w-full px-5 py-3 rounded-xl hover:bg-slate-800/60 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-base">กลับไปหน้าหลัก</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-72">
        <div className="max-w-6xl mx-auto py-10 px-4">
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-amber-400">สถานะการจองโต๊ะ</h1>
              <p className="text-slate-400 text-sm mt-1">สรุปจำนวนโต๊ะว่างและการจองปัจจุบัน</p>
            </div>
            <div className="text-sm text-slate-500">อัปเดตล่าสุดจากระบบจอง</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800 flex flex-col items-center shadow-lg">
              <span className="text-amber-400 font-bold text-lg mb-2">โต๊ะทั้งหมด</span>
              <span className="text-3xl font-extrabold text-white">{total}</span>
            </div>
            <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800 flex flex-col items-center shadow-lg">
              <span className="text-emerald-400 font-bold text-lg mb-2">ว่าง</span>
              <span className="text-3xl font-extrabold text-white">{available}</span>
            </div>
            <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800 flex flex-col items-center shadow-lg">
              <span className="text-rose-400 font-bold text-lg mb-2">จองแล้ว/ไม่ว่าง</span>
              <span className="text-3xl font-extrabold text-white">{reserved}</span>
            </div>
          </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {tables.map((table) => {
            const isAvailable = table.status === 'available';
            const reservation = latestReservationByTable.get(table.id);
            return (
              <div key={table.id} className="relative bg-slate-900/60 rounded-2xl border border-slate-800 shadow-lg p-7 flex flex-col items-center min-h-[260px] hover:border-slate-700 transition-colors">
                <div className="absolute top-4 left-6 text-amber-400 font-bold text-lg">✔ โต๊ะที่ {table.id}</div>
                <div className={`absolute top-4 right-6 font-bold text-lg ${isAvailable ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isAvailable ? 'ว่าง' : 'ไม่ว่าง'}
                </div>
                <div className="my-8 text-5xl text-amber-300">🧩</div>
                <div className="text-slate-200 font-medium mb-4 text-center">
                  {isAvailable ? 'โต๊ะว่างพร้อมให้บริการ' : 'โต๊ะถูกจองแล้ว'}
                </div>
                <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 mb-4 text-sm text-slate-300 space-y-1">
                  {reservation ? (
                    <>
                      <div className="flex justify-between"><span className="text-slate-400">ชื่อลูกค้า</span><span>{reservation.name}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">เบอร์</span><span>{reservation.phone}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">วัน/เวลา</span><span>{reservation.date} {reservation.time}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">จำนวนคน</span><span>{reservation.players}</span></div>
                    </>
                  ) : (
                    <div className="text-center text-slate-500">ยังไม่มีข้อมูลลูกค้า</div>
                  )}
                </div>
                {isAvailable ? (
                  <button
                    disabled
                    className="w-full font-bold py-3 rounded-xl text-base shadow transition-all bg-amber-500/20 text-amber-300 cursor-not-allowed"
                  >
                    พร้อมใช้งาน
                  </button>
                ) : reservation ? (
                  <button
                    onClick={() => handleCancel(reservation.id, table.id, reservation.firestoreId)}
                    className="w-full font-bold py-3 rounded-xl text-base shadow transition-all bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                  >
                    ยกเลิกการจอง
                  </button>
                ) : (
                  <button
                    className="w-full font-bold py-3 rounded-xl text-base shadow transition-all bg-slate-800 text-slate-400 cursor-not-allowed"
                    disabled
                  >
                    ไม่พร้อมใช้งาน
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-amber-400">รายการจองล่าสุด</h2>
            <span className="text-xs text-slate-500">ทั้งหมด {latestReservations.length} รายการ</span>
          </div>
          {latestReservations.length === 0 ? (
            <div className="text-slate-500">ยังไม่มีการจอง</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr className="border-b border-slate-800">
                    <th className="py-2">โต๊ะ</th>
                    <th className="py-2">ชื่อลูกค้า</th>
                    <th className="py-2">เบอร์</th>
                    <th className="py-2">วัน/เวลา</th>
                    <th className="py-2">จำนวนคน</th>
                    <th className="py-2">การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {latestReservations.map((r) => (
                    <tr key={r.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                      <td className="py-2">#{r.tableId}</td>
                      <td className="py-2">
                        {editingId === r.id ? (
                          <input
                            value={editForm.name}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-sm text-white"
                          />
                        ) : (
                          r.name
                        )}
                      </td>
                      <td className="py-2">
                        {editingId === r.id ? (
                          <input
                            value={editForm.phone}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-sm text-white"
                          />
                        ) : (
                          r.phone
                        )}
                      </td>
                      <td className="py-2">
                        {editingId === r.id ? (
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={editForm.date}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, date: e.target.value }))}
                              className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-sm text-white"
                            />
                            <input
                              type="time"
                              value={editForm.time}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, time: e.target.value }))}
                              className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-sm text-white"
                            />
                          </div>
                        ) : (
                          `${r.date} ${r.time}`
                        )}
                      </td>
                      <td className="py-2">
                        {editingId === r.id ? (
                          <input
                            value={editForm.players}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, players: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-sm text-white"
                          />
                        ) : (
                          r.players
                        )}
                      </td>
                      <td className="py-2">
                        {editingId === r.id ? (
                          <input
                            value={editForm.tableType}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, tableType: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-sm text-white"
                          />
                        ) : (
                          <span className="text-slate-400">{r.tableType}</span>
                        )}
                      </td>
                      <td className="py-2">
                        {editingId === r.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveEdit(r)}
                              className="text-emerald-300 hover:text-emerald-200"
                            >
                              บันทึก
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-slate-400 hover:text-slate-200"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => beginEdit(r)}
                              className="text-amber-300 hover:text-amber-200"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => handleCancel(r.id, r.tableId, r.firestoreId)}
                              className="text-rose-300 hover:text-rose-200"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

export default TableStatus;