import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Facebook, MessageCircle, Instagram, CreditCard, Truck, Shield, RotateCcw } from 'lucide-react';

interface ShopInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  facebook: string;
  line: string;
}

const LogoSVG = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg viewBox="0 0 100 120" className={className}>
    {/* Halo/Aura */}
    <ellipse cx="50" cy="18" rx="20" ry="6" fill="none" stroke="url(#goldGradientFooter)" strokeWidth="2" />
    {/* Rays */}
    <line x1="50" y1="5" x2="50" y2="12" stroke="url(#goldGradientFooter)" strokeWidth="2" strokeLinecap="round" />
    <line x1="35" y1="8" x2="38" y2="14" stroke="url(#goldGradientFooter)" strokeWidth="2" strokeLinecap="round" />
    <line x1="65" y1="8" x2="62" y2="14" stroke="url(#goldGradientFooter)" strokeWidth="2" strokeLinecap="round" />
    <line x1="25" y1="15" x2="30" y2="18" stroke="url(#goldGradientFooter)" strokeWidth="2" strokeLinecap="round" />
    <line x1="75" y1="15" x2="70" y2="18" stroke="url(#goldGradientFooter)" strokeWidth="2" strokeLinecap="round" />
    
    {/* Crown */}
    <path
      d="M15 55 L25 35 L35 42 L50 22 L65 42 L75 35 L85 55 L50 62 Z"
      fill="url(#goldGradientFooter)"
    />
    
    {/* MLB Text */}
    <text x="50" y="85" textAnchor="middle" fontSize="32" fontWeight="bold" fill="url(#goldGradientFooter)" fontFamily="serif">MLB</text>
    
    {/* MINDLAB Text */}
    <text x="50" y="100" textAnchor="middle" fontSize="10" fontWeight="bold" fill="url(#goldGradientFooter)" fontFamily="serif" letterSpacing="2">MINDLAB</text>
    
    {/* BOARD GAMES Text */}
    <text x="50" y="112" textAnchor="middle" fontSize="7" fill="url(#goldGradientFooter)" fontFamily="sans-serif" letterSpacing="1">BOARD GAMES</text>
    
    <defs>
      <linearGradient id="goldGradientFooter" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="50%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
    </defs>
  </svg>
);

const Footer = () => {
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);

  useEffect(() => {
    fetch('/data/products.json')
      .then((res) => res.json())
      .then((data) => {
        setShopInfo(data.shopInfo);
      })
      .catch((err) => {
        console.error('Error loading shop info:', err);
      });
  }, []);

  const services = [
    { icon: Truck, title: 'จัดส่งฟรี', desc: 'เมื่อซื้อครบ 1,000 บาท' },
    { icon: Shield, title: 'ของแท้ 100%', desc: 'รับประกันความแท้' },
    { icon: RotateCcw, title: 'เปลี่ยนคืนได้', desc: 'ภายใน 7 วัน' },
    { icon: CreditCard, title: 'ชำระหลายช่องทาง', desc: 'บัตรเครดิต/โอน' },
  ];

  return (
    <footer id="contact" className="w-full bg-gradient-to-b from-gray-900 to-gray-950 text-white border-t border-yellow-600/20">
      {/* Services Bar */}
      <div className="border-b border-yellow-600/20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-yellow-500/30">
                  <service.icon className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">{service.title}</p>
                  <p className="text-gray-400 text-xs">{service.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <LogoSVG className="w-20 h-24" />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              ร้านจำหน่ายการ์ดเกมและบอร์ดเกมคุณภาพในลำปาง ทั้ง Pokemon, battle of talingchan และอีกมากมาย 
              พร้อมบริการจองโต๊ะเล่นเกม
            </p>
            <div className="flex gap-3">
              <a href="https://www.facebook.com/profile.php?id=61581270073165" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 className="w-10 h-10 bg-yellow-500/20 hover:bg-yellow-500/40 rounded-lg flex items-center justify-center transition-colors border border-yellow-500/30">
                <Facebook className="w-5 h-5 text-yellow-500" />
              </a>
              <a href="#" className="w-10 h-10 bg-yellow-500/20 hover:bg-yellow-500/40 rounded-lg flex items-center justify-center transition-colors border border-yellow-500/30">
                <MessageCircle className="w-5 h-5 text-yellow-500" />
              </a>
              <a href="#" className="w-10 h-10 bg-yellow-500/20 hover:bg-yellow-500/40 rounded-lg flex items-center justify-center transition-colors border border-yellow-500/30">
                <Instagram className="w-5 h-5 text-yellow-500" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">เมนูหลัก</h3>
            <ul className="space-y-2">
              <li>
                <a href="#home" className="text-gray-400 hover:text-yellow-500 transition-colors text-sm">หน้าหลัก</a>
              </li>
              <li>
                <a href="#reserve" className="text-gray-400 hover:text-yellow-500 transition-colors text-sm">จองโต๊ะ</a>
              </li>
              <li>
                <a href="#shop" className="text-gray-400 hover:text-yellow-500 transition-colors text-sm">สินค้าทั้งหมด</a>
              </li>
              <li>
                <a href="#map" className="text-gray-400 hover:text-yellow-500 transition-colors text-sm">แผนที่ร้าน</a>
              </li>
              <li>
                <a href="#contact" className="text-gray-400 hover:text-yellow-500 transition-colors text-sm">ติดต่อเรา</a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">หมวดหมู่สินค้า</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors text-sm">Pokemon TCG</a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors text-sm">Battle Of Talingchan</a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors text-sm">บอร์ดเกม</a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div id="map">
            <h3 className="font-bold text-lg mb-4 text-white">ข้อมูลติดต่อ</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400 text-sm">
                  {shopInfo?.address || '25/28-29 ถ.สุเรนทร์ ต.สบตุ๋ย อ.เมือง จ.ลำปาง, Lampang, Thailand, 52100'}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                <span className="text-gray-400 text-sm">{shopInfo?.phone || '088-268-5394'}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                <span className="text-gray-400 text-sm">{shopInfo?.email || 'mindlablampang@gmail.com'}</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                <span className="text-gray-400 text-sm">{shopInfo?.openingHours || 'จันทร์-อาทิตย์: 11:30 - 19:00 น.'}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-yellow-600/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm text-center md:text-left">
              © 2024 Mindlab Boardgames & Card Games Lampang. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-500 hover:text-yellow-500 text-sm transition-colors">นโยบายความเป็นส่วนตัว</a>
              <a href="#" className="text-gray-500 hover:text-yellow-500 text-sm transition-colors">เงื่อนไขการใช้งาน</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
