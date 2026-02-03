import { useEffect, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { Calendar, Clock, Users, CheckCircle, Armchair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const TableReservation = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showFullDialog, setShowFullDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    players: '',
    tableType: '',
  });
  const timeSlots = [
    '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ];

  const playerOptions = ['1 คน', '2 คน', '3 คน', '4 คน', '5-6 คน', '7+ คน'];

  // โปรโมชั่นตามภาพ
  const tableTypes = [
    { value: '5hr', label: 'เล่นได้ 5 ชั่วโมง', price: '100 บาท/คน' },
    { value: 'day', label: 'เหมาทั้งวัน', price: '120 บาท/คน' },
    { value: 'student', label: 'นักเรียน', price: '30 บาท/คน/ชั่วโมง' },
    { value: 'general', label: 'บุคคลทั่วไป', price: '50 บาท/คน/ชั่วโมง' },
  ];

  const [showTableInfo] = useState(false);
  // Mock table data (should be replaced with real API in production)
  type TableState = { id: number; status: 'available' | 'reserved' };
  type Reservation = {
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
    createdAt?: string;
  };

  const initialTables: TableState[] = [
    { id: 1, status: 'available' },
    { id: 2, status: 'available' },
    { id: 3, status: 'available' },
    { id: 4, status: 'available' },
    { id: 5, status: 'available' },
    { id: 6, status: 'available' },
  ];
  const [tableStates, setTableStates] = useState<TableState[]>(() => {
    const stored = localStorage.getItem('table_states');
    return stored ? (JSON.parse(stored) as TableState[]) : initialTables;
  });
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const stored = localStorage.getItem('table_reservations');
    return stored ? (JSON.parse(stored) as Reservation[]) : [];
  });
  const total = tableStates.length;
  const reserved = tableStates.filter((t) => t.status === 'reserved').length;
  const available = total - reserved;

  useEffect(() => {
    localStorage.setItem('table_states', JSON.stringify(tableStates));
    window.dispatchEvent(new Event('table-reservation-updated'));
  }, [tableStates]);

  useEffect(() => {
    localStorage.setItem('table_reservations', JSON.stringify(reservations));
    window.dispatchEvent(new Event('table-reservation-updated'));
  }, [reservations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ถ้าไม่มีโต๊ะว่าง ให้ขึ้น dialog เตือน
    const hasAvailable = tableStates.some((t) => t.status === 'available');
    if (!hasAvailable) {
      setShowFullDialog(true);
      return;
    }
    setIsSubmitted(true);
    const availableTable = tableStates.find((t) => t.status === 'available');
    if (!availableTable) return;

    const reservationBase: Reservation = {
      id: Date.now(),
      tableId: availableTable.id,
      name: formData.name,
      phone: formData.phone,
      date: formData.date,
      time: formData.time,
      players: formData.players,
      tableType: formData.tableType,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    let firestoreId: string | undefined;
    if (isFirebaseConfigured) {
      try {
        const docRef = await addDoc(collection(db, 'table_reservations'), {
          ...reservationBase,
          createdAt: serverTimestamp()
        });
        firestoreId = docRef.id;
      } catch (error) {
        console.error('Failed to save reservation to Firestore:', error);
      }
    }

    const nextTableStates: TableState[] = tableStates.map((t) =>
      t.id === availableTable.id ? { ...t, status: 'reserved' as const } : t
    );
    const nextReservations = [...reservations, { ...reservationBase, firestoreId }];

    setTableStates(nextTableStates);
    setReservations(nextReservations);
    localStorage.setItem('table_states', JSON.stringify(nextTableStates));
    localStorage.setItem('table_reservations', JSON.stringify(nextReservations));
    window.dispatchEvent(new Event('table-reservation-updated'));
  };

  return (
    <section id="reserve" className="w-full py-12 bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-500 px-4 py-2 rounded-full mb-4 border border-yellow-500/30">
              <Armchair className="w-5 h-5" />
              <span className="font-semibold">บริการจองโต๊ะ</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              จองโต๊ะเล่นการ์ดเกม
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              จองโต๊ะล่วงหน้าเพื่อความสะดวกในการเล่นการ์ดเกมกับเพื่อนๆ 
              รองรับทุกรูปแบบการเล่น
            </p>
          </div>

          {/* Reservation Form */}
          <div className="bg-gray-950 rounded-2xl p-6 md:p-8 shadow-2xl border border-yellow-600/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">
                    ชื่อ-นามสกุล <span className="text-yellow-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="กรุณากรอกชื่อของคุณ"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-gray-900 border-gray-700 focus:border-yellow-500 focus:ring-yellow-500/20 text-white"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-300">
                    เบอร์โทรศัพท์ <span className="text-yellow-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0xx-xxx-xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="bg-gray-900 border-gray-700 focus:border-yellow-500 focus:ring-yellow-500/20 text-white"
                  />
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-gray-300">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    วันที่จอง <span className="text-yellow-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="bg-gray-900 border-gray-700 focus:border-yellow-500 focus:ring-yellow-500/20 text-white"
                  />
                </div>

                {/* Time */}
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-gray-300">
                    <Clock className="w-4 h-4 inline mr-1" />
                    เวลา <span className="text-yellow-500">*</span>
                  </Label>
                  <Select
                    value={formData.time}
                    onValueChange={(value) => setFormData({ ...formData, time: value })}
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                      <SelectValue placeholder="เลือกเวลา" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time} className="text-white hover:bg-yellow-500/20">
                          {time} น.
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Players */}
                <div className="space-y-2">
                  <Label htmlFor="players" className="text-gray-300">
                    <Users className="w-4 h-4 inline mr-1" />
                    จำนวนคน <span className="text-yellow-500">*</span>
                  </Label>
                  <Select
                    value={formData.players}
                    onValueChange={(value) => setFormData({ ...formData, players: value })}
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                      <SelectValue placeholder="เลือกจำนวนคน" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      {playerOptions.map((option) => (
                        <SelectItem key={option} value={option} className="text-white hover:bg-yellow-500/20">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Table Type */}
                <div className="space-y-2">
                  <Label htmlFor="tableType" className="text-gray-300">
                    <Armchair className="w-4 h-4 inline mr-1" />
                    ประเภทโต๊ะ <span className="text-yellow-500">*</span>
                  </Label>
                  <Select
                    value={formData.tableType}
                    onValueChange={(value) => setFormData({ ...formData, tableType: value })}
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                      <SelectValue placeholder="เลือกประเภทโต๊ะ" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      {tableTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="text-white hover:bg-yellow-500/20">
                          {type.label} - {type.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>


              <div className="flex flex-col md:flex-row gap-4 w-full">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 py-6 text-lg font-bold"
                >
                  ยืนยันการจอง
                </Button>
              </div>

              <p className="text-center text-gray-500 text-sm">
                * กรุณามาถึงก่อนเวลาจอง 15 นาที หากเลยเวลาจอง 30 นาที จะถือว่าสละสิทธิ์
              </p>

              {showTableInfo && (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                  {tableTypes.map((type) => (
                    <div
                      key={type.value}
                      className="bg-yellow-500/90 rounded-xl p-5 shadow-lg border-2 border-yellow-600 hover:border-yellow-400 transition-all flex flex-col items-center"
                    >
                      <div className="w-16 h-16 bg-yellow-400 rounded-lg flex items-center justify-center mb-3 shadow-lg shadow-yellow-500/30">
                        <Armchair className="w-8 h-8 text-gray-900" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2 text-center">{type.label}</h3>
                      <p className="text-gray-900 font-bold text-xl text-center">{type.price}</p>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* Table Types Info */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {tableTypes.map((type) => (
              <div
                key={type.value}
                className="bg-gray-900 rounded-xl p-5 shadow-lg border border-yellow-600/20 hover:border-yellow-500/40 transition-all flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center mb-3 shadow-lg shadow-yellow-500/20">
                  <Armchair className="w-8 h-8 text-gray-900" />
                </div>
                <h3 className="font-semibold text-white mb-2 text-center">{type.label}</h3>
                <p className="text-yellow-500 font-bold text-xl text-center">{type.price}</p>
              </div>
            ))}
          </div>

          {/* Table Status Summary Tab (moved below price info) */}
          <div className="max-w-4xl mx-auto my-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-900 rounded-xl p-6 border-2 border-yellow-500 flex flex-col items-center">
                <span className="text-yellow-500 font-bold text-lg mb-2">โต๊ะทั้งหมด</span>
                <span className="text-3xl font-extrabold text-yellow-400">{total}</span>
              </div>
              <div className="bg-gray-900 rounded-xl p-6 border-2 border-green-400 flex flex-col items-center">
                <span className="text-green-400 font-bold text-lg mb-2">ว่าง</span>
                <span className="text-3xl font-extrabold text-green-300">{available}</span>
              </div>
              <div className="bg-gray-900 rounded-xl p-6 border-2 border-red-400 flex flex-col items-center">
                <span className="text-red-400 font-bold text-lg mb-2">จองแล้ว/ไม่ว่าง</span>
                <span className="text-3xl font-extrabold text-red-300">{reserved}</span>
              </div>
            </div>
            {/* ...ไม่มีปุ่มดูรายละเอียดสถานะโต๊ะทั้งหมด... */}
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={isSubmitted} onOpenChange={setIsSubmitted}>
        <DialogContent className="max-w-md bg-gray-900 border-yellow-600/30">
          <DialogHeader className="text-center">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/30">
              <CheckCircle className="w-8 h-8 text-yellow-500" />
            </div>
            <DialogTitle className="text-xl text-white">จองโต๊ะสำเร็จ!</DialogTitle>
            <DialogDescription className="text-gray-400">
              เราได้รับการจองของคุณแล้ว กรุณารอการยืนยันผ่าน SMS หรือโทรศัพท์
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-950 rounded-lg p-4 mt-4 border border-yellow-600/20">
            <p className="text-sm text-gray-300"><strong className="text-yellow-500">ชื่อ:</strong> {formData.name}</p>
            <p className="text-sm text-gray-300"><strong className="text-yellow-500">วันที่:</strong> {formData.date}</p>
            <p className="text-sm text-gray-300"><strong className="text-yellow-500">เวลา:</strong> {formData.time} น.</p>
            <p className="text-sm text-gray-300"><strong className="text-yellow-500">จำนวนคน:</strong> {formData.players}</p>
            <p className="text-sm text-green-400 mt-4 font-bold">ขณะนี้มีโต๊ะที่ถูกจองไปแล้ว {reserved} โต๊ะ</p>
                {/* Full Table Dialog */}
                <Dialog open={showFullDialog} onOpenChange={setShowFullDialog}>
                  <DialogContent className="max-w-md bg-gray-900 border-yellow-600/30">
                    <DialogHeader className="text-center">
                      <DialogTitle className="text-xl text-red-500">ขออภัยตอนนี้โต๊ะไม่ว่าง</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        กรุณาลองใหม่ภายหลัง หรือสอบถามพนักงานหน้าร้าน
                      </DialogDescription>
                    </DialogHeader>
                    <Button
                      onClick={() => setShowFullDialog(false)}
                      className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 font-bold mt-4"
                    >
                      ปิด
                    </Button>
                  </DialogContent>
                </Dialog>
          </div>
          <Button
            onClick={() => {
              setIsSubmitted(false);
              setFormData({
                name: '',
                phone: '',
                date: '',
                time: '',
                players: '',
                tableType: '',
              });
            }}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 font-bold"
          >
            ตกลง
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default TableReservation;
