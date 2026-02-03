import { useState } from 'react';
import { User as UserIcon, LogOut, MapPin, Phone, Mail, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';

interface UserProfileProps {
  children: React.ReactNode;
}

export const UserProfile = ({ children }: UserProfileProps) => {
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const handleSaveProfile = () => {
    updateProfile({
      name: editData.name,
      phone: editData.phone,
      address: editData.address,
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
  };

  if (!user) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="bg-gradient-to-b from-gray-900 to-gray-950 border-yellow-600/30 w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="border-b border-yellow-600/30 pb-4">
          <SheetTitle className="text-yellow-500 text-2xl font-bold text-left">
            👤 โปรไฟล์ของฉัน
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* User Avatar */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
              <UserIcon className="w-10 h-10 text-gray-900" />
            </div>
          </div>

          {/* User Info */}
          {!isEditing ? (
            <div className="space-y-4">
              <div className="bg-gray-800/40 border-2 border-yellow-600/30 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <UserIcon className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-400 text-sm">ชื่อ</span>
                </div>
                <p className="text-yellow-400 font-bold text-lg ml-8">{user.name}</p>
              </div>

              <div className="bg-gray-800/40 border-2 border-yellow-600/30 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-400 text-sm">อีเมล</span>
                </div>
                <p className="text-yellow-400 font-bold text-lg ml-8">{user.email}</p>
              </div>

              {user.phone && (
                <div className="bg-gray-800/40 border-2 border-yellow-600/30 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Phone className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-400 text-sm">เบอร์โทร</span>
                  </div>
                  <p className="text-yellow-400 font-bold text-lg ml-8">{user.phone}</p>
                </div>
              )}

              {user.address && (
                <div className="bg-gray-800/40 border-2 border-yellow-600/30 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-400 text-sm">ที่อยู่</span>
                  </div>
                  <p className="text-yellow-400 font-bold text-lg ml-8">{user.address}</p>
                </div>
              )}

              <div className="text-gray-400 text-xs text-center pt-2">
                สมาชิกตั้งแต่ {new Date(user.createdAt).toLocaleDateString('th-TH')}
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-gradient-to-r from-yellow-500 via-yellow-500 to-yellow-600 hover:from-yellow-400 hover:via-yellow-400 hover:to-yellow-500 text-gray-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Edit2 className="w-5 h-5" />
                  แก้ไขข้อมูล
                </Button>

                <Button
                  onClick={handleLogout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-5 h-5" />
                  ออกจากระบบ
                </Button>
              </div>
            </div>
          ) : (
            // Edit Mode
            <div className="space-y-4">
              <div>
                <label className="block text-yellow-400 font-semibold mb-2 text-sm">
                  ชื่อ
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-gray-800/60 border-2 border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition"
                />
              </div>

              <div>
                <label className="block text-yellow-400 font-semibold mb-2 text-sm">
                  เบอร์โทร
                </label>
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) =>
                    setEditData({ ...editData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-gray-800/60 border-2 border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition"
                  placeholder="0812345678"
                />
              </div>

              <div>
                <label className="block text-yellow-400 font-semibold mb-2 text-sm">
                  ที่อยู่
                </label>
                <textarea
                  value={editData.address}
                  onChange={(e) =>
                    setEditData({ ...editData, address: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-gray-800/60 border-2 border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition resize-none"
                  rows={3}
                  placeholder="ที่อยู่ของคุณ"
                />
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleSaveProfile}
                  className="w-full bg-gradient-to-r from-yellow-500 via-yellow-500 to-yellow-600 hover:from-yellow-400 hover:via-yellow-400 hover:to-yellow-500 text-gray-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Save className="w-5 h-5" />
                  บันทึก
                </Button>

                <Button
                  onClick={() => setIsEditing(false)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <X className="w-5 h-5" />
                  ยกเลิก
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
