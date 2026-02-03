import { useState, useEffect } from 'react';
import { Menu, MapPin, ShoppingBag, Phone, Calendar, Plus, Minus, Trash2, LogIn, User as UserIcon, LogOut, ArrowLeft, Image as ImageIcon, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCart } from '@/lib/cart';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// --- Firebase Imports ---
// แก้ไข: แยก Import functions กับ Type ออกจากกันเพื่อป้องกัน Error
// ลบ Firebase ออก ใช้ localStorage สำหรับ mock user

const LogoSVG = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg viewBox="0 0 100 120" className={`transition-transform duration-500 ease-in-out hover:rotate-6 hover:scale-110 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] ${className}`}>
    {/* Halo/Aura */}
    <ellipse cx="50" cy="18" rx="20" ry="6" fill="none" stroke="url(#goldGradient)" strokeWidth="2" className="animate-pulse" />
    {/* Rays */}
    <line x1="50" y1="5" x2="50" y2="12" stroke="url(#goldGradient)" strokeWidth="2" strokeLinecap="round" />
    <line x1="35" y1="8" x2="38" y2="14" stroke="url(#goldGradient)" strokeWidth="2" strokeLinecap="round" />
    <line x1="65" y1="8" x2="62" y2="14" stroke="url(#goldGradient)" strokeWidth="2" strokeLinecap="round" />
    <line x1="25" y1="15" x2="30" y2="18" stroke="url(#goldGradient)" strokeWidth="2" strokeLinecap="round" />
    <line x1="75" y1="15" x2="70" y2="18" stroke="url(#goldGradient)" strokeWidth="2" strokeLinecap="round" />
    
    {/* Crown */}
    <path
      d="M15 55 L25 35 L35 42 L50 22 L65 42 L75 35 L85 55 L50 62 Z"
      fill="url(#goldGradient)"
    />
    
    {/* MLB Text */}
    <text x="50" y="85" textAnchor="middle" fontSize="32" fontWeight="bold" fill="url(#goldGradient)" fontFamily="serif">MLB</text>
    
    {/* MINDLAB Text */}
    <text x="50" y="100" textAnchor="middle" fontSize="10" fontWeight="bold" fill="url(#goldGradient)" fontFamily="serif" letterSpacing="2">MINDLAB</text>
    
    {/* BOARD GAMES Text */}
    <text x="50" y="112" textAnchor="middle" fontSize="7" fill="url(#goldGradient)" fontFamily="sans-serif" letterSpacing="1">BOARD GAMES</text>
    
    <defs>
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="50%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
    </defs>
  </svg>
);

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    note: '',
  });
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  
  // Hooks for navigation and location
  const location = useLocation();
  const navigate = useNavigate();
  
  // --- Auth State Logic (localStorage) ---
  type AuthUser = { name?: string; email: string; role?: string; profileImage?: string } | null;
  const [user, setUser] = useState<AuthUser>(null);
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [pendingProfileImage, setPendingProfileImage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      const userObj = JSON.parse(storedUser);
      setUser(userObj);
      // Prefer profileImage from user object if exists
      if (userObj.profileImage) {
        setProfileImage(userObj.profileImage);
      } else {
        const img = localStorage.getItem('profile_image');
        if (img) setProfileImage(img);
      }
    } else {
      setUser(null);
      setProfileImage(null);
    }
  }, [userDrawerOpen, showConfirmModal, profileImage]);

  const handleLogout = () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('profile_image');
    setUser(null);
    setProfileImage(null);
    window.location.reload();
  };

  // ฟังก์ชันช่วย Scroll ไปยัง Section ต่างๆ
  const handleSectionMenuClick = (e: React.MouseEvent<HTMLElement>, sectionId: string) => {
    if (window.location.pathname === '/') {
      e.preventDefault();
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.hash = `#${sectionId}`;
      }
    }
  };

  // ฟังก์ชันสำหรับปุ่มหน้าหลัก
  const handleHomeMenuClick = (e: React.MouseEvent<HTMLElement>) => {
    if (window.location.pathname !== '/') {
      // ถ้าอยู่หน้าอื่น ให้ Link ทำงานปกติเพื่อเปลี่ยนหน้ากลับมาหน้าแรก
    } else {
      // ถ้าอยู่หน้าแรกอยู่แล้ว ให้ Scroll ขึ้นไปบนสุด
      e.preventDefault();
      const el = document.getElementById('home');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const menuItems = [
    { name: 'หน้าหลัก', to: '/', icon: null, onClick: handleHomeMenuClick },
    { name: 'จองโต๊ะ', to: '/', icon: Calendar, onClick: (e: React.MouseEvent<HTMLElement>) => handleSectionMenuClick(e, 'reserve') },
    { name: 'สินค้า', to: '/products', icon: ShoppingBag, onClick: (e: React.MouseEvent<HTMLElement>) => {
      if (window.location.pathname === '/') handleSectionMenuClick(e, 'shop');
    } },
    { name: 'แผนที่', to: '/', icon: MapPin, onClick: (e: React.MouseEvent<HTMLElement>) => handleSectionMenuClick(e, 'map') },
    { name: 'ติดต่อร้าน', to: '/', icon: Phone, onClick: (e: React.MouseEvent<HTMLElement>) => handleSectionMenuClick(e, 'contact') },
  ];

  // เช็คว่าต้องแสดงปุ่ม Back หรือไม่ (ถ้าไม่ใช่หน้าแรก ให้แสดง)
  const showBackButton = location.pathname !== '/';

  return (
    <header className="sticky top-0 z-[100] w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-lg border-b border-yellow-600/30 backdrop-blur-md transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          
          {/* Logo Area & Back Button */}
          <div className="flex items-center gap-2 sm:gap-4 transition-all duration-300">
            {/* ปุ่มย้อนกลับ (แสดงเมื่อไม่ใช่หน้าแรก) */}
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-full w-10 h-10 transition-all duration-300 group mr-1"
                aria-label="Go Back"
              >
                <ArrowLeft className="w-6 h-6 transition-transform duration-300 group-hover:-translate-x-1" />
              </Button>
            )}

            <Link to="/" onClick={handleHomeMenuClick} className="flex items-center gap-3 group cursor-pointer">
              <LogoSVG className="w-12 h-14 sm:w-14 sm:h-16 transition-transform duration-500 ease-out group-hover:scale-105" />
            </Link>
          </div>

          {/* Desktop Menu + Cart (center) */}
          <nav className="hidden md:flex items-center gap-2">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.to}
                onClick={item.onClick}
                className="relative flex items-center gap-2 px-4 py-2.5 text-yellow-500/90 hover:text-yellow-400 hover:bg-yellow-500/15 rounded-lg transition-all duration-300 border border-transparent hover:border-yellow-600/30 hover:shadow-[0_0_15px_rgba(234,179,8,0.1)] active:scale-95 group overflow-hidden"
              >
                {item.icon && <item.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />}
                <span className="font-medium relative z-10">{item.name}</span>
              </Link>
            ))}
            
            {/* Cart Button */}
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="lg"
                  className="relative text-yellow-500 hover:bg-yellow-500/15 px-3 ml-2 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                >
                  <ShoppingBag className="w-8 h-8 transition-transform duration-300 hover:rotate-6" />
                  {items.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold animate-bounce shadow-md border border-red-400">
                      {items.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-gradient-to-b from-gray-900 to-gray-950 border-yellow-600/30 w-full sm:max-w-[90%] md:max-w-[900px] flex flex-col">
                <SheetHeader className="border-b border-yellow-600/30 pb-4">
                  <SheetTitle className="text-yellow-500 text-2xl font-bold flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6" /> ตระกร้าสินค้า
                  </SheetTitle>
                </SheetHeader>
                
                {items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 animate-in fade-in duration-500">
                    <ShoppingBag className="w-20 h-20 mb-4 opacity-30" />
                    <p className="text-lg font-medium">ยังไม่มีสินค้าในตระกร้า</p>
                    <Button 
                      variant="outline" 
                      className="mt-6 border-yellow-600/50 text-yellow-500 hover:bg-yellow-500/10"
                      onClick={() => setCartOpen(false)}
                    >
                      เลือกซื้อสินค้า
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto space-y-3 mt-4 pr-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-gray-800/60 rounded-xl p-4 space-y-3 border-2 border-yellow-600/30 hover:border-yellow-500/50 hover:bg-gray-800/80 transition-all duration-300 group"
                        >
                          <div className="flex justify-between items-start gap-4">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-24 h-32 object-cover rounded-lg flex-shrink-0 border border-yellow-600/20 group-hover:scale-105 transition-transform duration-300"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-yellow-400 font-bold text-lg line-clamp-2">
                                {item.name}
                              </h4>
                              <p className="text-yellow-500 font-bold text-2xl mt-2">
                                ฿{item.price.toLocaleString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-red-500 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-3 bg-gray-900/50 rounded-lg p-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="text-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-300 active:scale-90 transition-transform"
                            >
                              <Minus className="w-6 h-6" />
                            </Button>
                            <div className="flex-1 text-center">
                              <span className="text-yellow-400 font-bold text-xl block">
                                {item.quantity}
                              </span>
                              <span className="text-gray-500 text-xs">จำนวน</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="text-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-300 active:scale-90 transition-transform"
                            >
                              <Plus className="w-6 h-6" />
                            </Button>
                          </div>
                          <div className="flex justify-between items-center bg-yellow-500/10 rounded-lg p-3 border border-yellow-600/20">
                            <span className="text-gray-400 text-sm">รวมราคา:</span>
                            <span className="text-yellow-400 font-bold text-xl">
                              ฿{(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t-2 border-yellow-600/30 pt-6 space-y-4 mt-6">
                      <div className="space-y-3 bg-gradient-to-br from-gray-800/80 to-gray-900/60 rounded-xl p-5 border-2 border-yellow-600/20 shadow-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-base">ราคาสินค้า:</span>
                          <span className="text-yellow-400 font-semibold text-lg">฿{total.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-yellow-600/20 pt-4 flex justify-between items-center">
                          <span className="text-yellow-400 font-bold text-lg">รวมทั้งสิ้น:</span>
                          <span className="text-yellow-300 font-bold text-3xl drop-shadow-md">
                            ฿{total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => setCheckoutOpen(true)}
                        className="w-full bg-gradient-to-r from-yellow-500 via-yellow-500 to-yellow-600 hover:from-yellow-400 hover:via-yellow-400 hover:to-yellow-500 text-gray-900 font-bold text-xl py-8 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-95"
                      >
                        ชำระเงิน
                      </Button>
                    </div>
                  </>
                )}
              </SheetContent>
            </Sheet>

            <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
              <DialogContent className="bg-gray-900 border border-yellow-600/30 text-white">
                <DialogHeader>
                  <DialogTitle className="text-yellow-500 text-xl">กรอกข้อมูลสำหรับการชำระเงิน</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (items.length === 0) return;

                    const order = {
                      id: Date.now(),
                      createdAt: new Date().toISOString(),
                      status: 'pending' as const,
                      total,
                      customer: {
                        fullName: checkoutForm.fullName.trim(),
                        phone: checkoutForm.phone.trim(),
                        address: checkoutForm.address.trim(),
                        note: checkoutForm.note.trim(),
                      },
                      items: items.map((item) => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        image: item.image,
                      })),
                    };

                    const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
                    localStorage.setItem('orders', JSON.stringify([order, ...storedOrders]));
                    window.dispatchEvent(new Event('orders-updated'));

                    if (isFirebaseConfigured) {
                      try {
                        await addDoc(collection(db, 'orders'), {
                          ...order,
                          createdAt: serverTimestamp(),
                        });
                      } catch (error) {
                        console.error('Failed to save order in Firestore:', error);
                      }
                    }

                    clearCart();
                    setCheckoutForm({ fullName: '', phone: '', address: '', note: '' });
                    setCheckoutOpen(false);
                    setCartOpen(false);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">ชื่อ-สกุล</label>
                    <input
                      type="text"
                      required
                      value={checkoutForm.fullName}
                      onChange={(e) =>
                        setCheckoutForm((prev) => ({ ...prev, fullName: e.target.value }))
                      }
                      className="w-full rounded-lg border border-yellow-600/30 bg-gray-950 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="ชื่อและนามสกุล"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">เบอร์โทร</label>
                    <input
                      type="tel"
                      required
                      value={checkoutForm.phone}
                      onChange={(e) =>
                        setCheckoutForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className="w-full rounded-lg border border-yellow-600/30 bg-gray-950 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="เช่น 08x-xxx-xxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">ที่อยู่</label>
                    <textarea
                      required
                      value={checkoutForm.address}
                      onChange={(e) =>
                        setCheckoutForm((prev) => ({ ...prev, address: e.target.value }))
                      }
                      className="w-full min-h-[90px] rounded-lg border border-yellow-600/30 bg-gray-950 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="ที่อยู่สำหรับจัดส่ง"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">หมายเหตุเพิ่มเติม (ถ้ามี)</label>
                    <textarea
                      value={checkoutForm.note}
                      onChange={(e) =>
                        setCheckoutForm((prev) => ({ ...prev, note: e.target.value }))
                      }
                      className="w-full min-h-[70px] rounded-lg border border-yellow-600/30 bg-gray-950 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="เช่น เวลาที่สะดวกรับสินค้า"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-yellow-600/40 text-yellow-500 hover:bg-yellow-500/10"
                      onClick={() => setCheckoutOpen(false)}
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="submit"
                      className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold"
                    >
                      ยืนยันข้อมูล
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </nav>

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="text-yellow-500 hover:bg-yellow-500/10 transition-transform active:scale-90"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-gradient-to-b from-gray-900 to-gray-950 border-yellow-600/30 w-72">
              <SheetHeader>
                <SheetTitle className="text-yellow-500 flex items-center justify-center gap-2">
                  <LogoSVG className="w-20 h-24 animate-pulse-slow" />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                {menuItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.to}
                    onClick={e => {
                      setIsOpen(false);
                      if (item.onClick) item.onClick(e);
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-yellow-500/90 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all duration-200 active:scale-95"
                  >
                    {item.icon && <item.icon className="w-5 h-5" />}
                    <span className="text-lg">{item.name}</span>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* --- Auth Buttons --- */}
          {!user ? (
            <Button asChild className="ml-3 bg-gradient-to-r from-yellow-500 via-yellow-500 to-yellow-600 hover:from-yellow-400 hover:via-yellow-400 hover:to-yellow-500 text-gray-900 font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 hover:shadow-[0_0_15px_rgba(234,179,8,0.4)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
              <Link to="/login">
                <LogIn className="w-5 h-5" />
                <span className="hidden sm:inline">เข้าสู่ระบบ</span>
              </Link>
            </Button>
          ) : (
            <div className="flex items-center gap-3 ml-3">
              <Button
                variant="ghost"
                size="icon"
                className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/40 rounded-full w-10 h-10 flex items-center justify-center"
                aria-label="User Profile"
                title={user.name || user.email}
                onClick={() => setUserDrawerOpen(true)}
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-8 h-8 object-cover rounded-full" />
                ) : (
                  <UserIcon className="w-6 h-6" />
                )}
              </Button>
              {/* Logout button removed from header, will be placed in drawer below */}
              {/* User Drawer */}
              <Sheet open={userDrawerOpen} onOpenChange={setUserDrawerOpen}>
                <SheetContent side="right" className="bg-gradient-to-b from-gray-900 to-gray-950 border-yellow-600/30 w-full sm:max-w-[420px] flex flex-col">
                  <SheetHeader className="border-b border-yellow-600/30 pb-4">
                    <SheetTitle className="text-yellow-500 text-2xl font-bold flex items-center gap-2">
                      <UserIcon className="w-6 h-6" /> โปรไฟล์ผู้ใช้
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto px-6 pb-8">
                    <div className="flex flex-col items-center gap-4 mt-6">
                      {/* Profile Image */}
                      <div className="relative group">
                        <label htmlFor="profile-upload" className="cursor-pointer">
                          <div className="w-24 h-24 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 border-2 border-yellow-400 overflow-hidden">
                            {pendingProfileImage ? (
                              <img src={pendingProfileImage} alt="Preview" className="w-full h-full object-cover rounded-full" />
                            ) : profileImage ? (
                              <img src={profileImage} alt="Profile" className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <ImageIcon className="w-10 h-10" />
                            )}
                          </div>
                          <input
                            id="profile-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setPendingProfileImage(ev.target?.result as string);
                                  setShowConfirmModal(true);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute -bottom-2 right-0 text-xs px-2.5 py-1 bg-gray-900/90 border-yellow-500/40 text-yellow-300 hover:text-yellow-200 hover:bg-yellow-500/10 shadow-sm"
                          onClick={() => document.getElementById('profile-upload')?.click()}
                        >
                          เปลี่ยนรูป
                        </Button>
                      </div>
                      {/* Confirm Modal */}
                      {showConfirmModal && (
                        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60">
                          <div className="bg-gray-900 rounded-2xl p-8 border-2 border-yellow-500 shadow-xl flex flex-col items-center">
                            <div className="mb-4 text-yellow-400 font-bold text-lg">ยืนยันการเปลี่ยนรูปโปรไฟล์</div>
                            {pendingProfileImage && (
                              <img src={pendingProfileImage} alt="Preview" className="w-24 h-24 object-cover rounded-full border-2 border-yellow-400 mb-4" />
                            )}
                            <div className="flex gap-4">
                              <Button size="sm" className="bg-yellow-500 text-gray-900 font-bold" onClick={() => {
                                setProfileImage(pendingProfileImage);
                                // Save image to user object in localStorage (mock database)
                                const storedUser = localStorage.getItem('auth_user');
                                if (storedUser) {
                                  const userObj = JSON.parse(storedUser);
                                  userObj.profileImage = pendingProfileImage;
                                  localStorage.setItem('auth_user', JSON.stringify(userObj));
                                  // Update profile image in mock_users array
                                  const usersRaw = localStorage.getItem('mock_users');
                                  if (usersRaw) {
                                    const usersArr = JSON.parse(usersRaw);
                                    const updatedArr = usersArr.map((u: any) =>
                                      u.email === userObj.email ? { ...u, profileImage: pendingProfileImage } : u
                                    );
                                    localStorage.setItem('mock_users', JSON.stringify(updatedArr));
                                  }
                                }
                                localStorage.setItem('profile_image', pendingProfileImage!);
                                setPendingProfileImage(null);
                                setShowConfirmModal(false);
                              }}>ยืนยัน</Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                setPendingProfileImage(null);
                                setShowConfirmModal(false);
                              }}>ยกเลิก</Button>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{user.name || user.email}</div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </div>
                    </div>
                    <div className="mt-8 space-y-4">
                      {/* Change Password with Old Password Confirmation */}
                      <div className="bg-gray-900/60 rounded-2xl p-5 border border-slate-800">
                        <div className="flex items-center gap-2 mb-4">
                          <Key className="w-5 h-5 text-yellow-400" />
                          <span className="font-bold text-yellow-400">เปลี่ยนรหัสผ่าน</span>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">รหัสผ่านเดิม</label>
                            <input type="password" placeholder="รหัสผ่านเดิม" className="w-full bg-gray-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 outline-none" id="old-password" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">รหัสผ่านใหม่</label>
                            <input type="password" placeholder="รหัสผ่านใหม่" className="w-full bg-gray-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 outline-none" id="new-password" />
                          </div>
                        </div>
                        <Button size="sm" className="w-full mt-4 bg-yellow-500 text-gray-900 font-bold hover:bg-yellow-400" onClick={() => {
                          const oldPass = (document.getElementById('old-password') as HTMLInputElement)?.value;
                          const newPass = (document.getElementById('new-password') as HTMLInputElement)?.value;
                          if (!oldPass || !newPass) {
                            alert('กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่');
                            return;
                          }
                          // Mock: Assume old password is always correct
                          alert('เปลี่ยนรหัสผ่านสำเร็จ (mock)');
                        }}>บันทึกรหัสผ่านใหม่</Button>
                      </div>
                      {/* Admin Dashboard Button (only for admin) */}
                      {user && user.role === 'admin' && (
                        <Button
                          size="lg"
                          className="w-full bg-yellow-500 text-black font-bold text-base shadow hover:bg-yellow-400"
                          onClick={() => window.location.href = '/admin'}
                        >
                          เข้าระบบหลังบ้าน (Admin)
                        </Button>
                      )}
                      {/* Logout Button in Drawer */}
                      <Button 
                        onClick={handleLogout}
                        variant="ghost"
                        size="lg"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full flex items-center justify-center gap-2"
                      >
                        <LogOut className="w-5 h-5" /> ออกจากระบบ
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;