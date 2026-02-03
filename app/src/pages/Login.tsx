import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
// ลบ Firebase ออก ใช้ local/mock user
import { 
  Mail, 
  Lock, 
  User, 
  ArrowLeft, 
  Loader2, 
  Key, 
  Smile,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Login() {
  const navigate = useNavigate();
  
  // State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // สำหรับ Signup
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load or initialize mock users from localStorage
  const defaultUsers = [
    { name: 'Admin', email: 'admin@example.com', password: 'admin123', role: 'admin' },
    { name: 'Demo User', email: 'demo@example.com', password: 'password123', role: 'user' }
  ];
  const [mockUsers, setMockUsers] = useState(() => {
    const saved = localStorage.getItem('mock_users');
    return saved ? JSON.parse(saved) : defaultUsers;
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (authMode === 'login') {
        // --- เข้าสู่ระบบ (mock) ---
        const found = mockUsers.find(u => u.email === email && u.password === password);
        if (!found) throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        localStorage.setItem('auth_user', JSON.stringify(found));
        // Admin redirect: go to homepage first
        navigate('/');
      } else {
        // --- สมัครสมาชิก (mock) ---
        if (!name.trim()) throw new Error('กรุณากรอกชื่อผู้ใช้งาน');
        if (mockUsers.some(u => u.email === email)) throw new Error('อีเมลนี้ถูกใช้งานแล้ว');
        if (password.length < 6) throw new Error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        const newUser = { name, email, password, role: 'user' };
        const updatedUsers = [...mockUsers, newUser];
        setMockUsers(updatedUsers);
        localStorage.setItem('mock_users', JSON.stringify(updatedUsers));
        localStorage.setItem('auth_user', JSON.stringify(newUser));
        navigate('/');
      }
    } catch (err: any) {
      let msg = err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decoration (Optional) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Main Card with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={authMode}
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.96 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-[#111827] w-full max-w-md rounded-2xl border border-gray-800 shadow-2xl overflow-hidden relative z-10"
        >
        
        {/* Header Section */}
        <div className="bg-[#1e293b] p-6 text-center border-b border-gray-800 relative">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
            <span className="text-yellow-500 text-2xl">MLB</span> Mindlab
          </h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Board Games & TCG</p>
        </div>

        {/* Content Section */}
        <div className="p-8">
          
          <div className="mb-6 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">
              {authMode === 'login' ? 'ยินดีต้อนรับกลับมา' : 'สร้างบัญชีใหม่'}
            </h3>
            <p className="text-gray-400 text-sm">
              {authMode === 'login' ? 'เข้าสู่ระบบเพื่อจัดการการจองและสินค้าของคุณ' : 'สมัครสมาชิกเพื่อรับสิทธิพิเศษมากมาย'}
            </p>
          </div>

          {/* Hint Box (Optional - ลบออกได้ถ้าไม่ใช้) */}
          {authMode === 'login' && (
            <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-3 mb-6 flex gap-3 items-start">
              <Key className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-200/80 font-mono">
                <p>Demo User: <span className="text-white">demo@example.com</span></p>
                <p>Pass: <span className="text-white">password123</span></p>
              </div>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* Name Field (Signup Only) */}
            {authMode === 'signup' && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-medium text-yellow-500 ml-1">ชื่อผู้ใช้งาน</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-yellow-500 transition-colors">
                    <Smile className="w-5 h-5" />
                  </div>
                  <input 
                    type="text" 
                    required={authMode === 'signup'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ชื่อของคุณ (เช่น มาร์ค)"
                    className="w-full bg-[#0a0f1c] border border-gray-700 text-white text-sm rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 block w-full pl-10 p-3 outline-none transition-all placeholder-gray-600"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-yellow-500 ml-1">อีเมล</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-yellow-500 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#0a0f1c] border border-gray-700 text-white text-sm rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 block w-full pl-10 p-3 outline-none transition-all placeholder-gray-600"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                 <label className="text-xs font-medium text-yellow-500">รหัสผ่าน</label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-yellow-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-[#0a0f1c] border border-gray-700 text-white text-sm rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 block w-full pl-10 p-3 outline-none transition-all placeholder-gray-600"
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2 animate-pulse">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-11 text-base shadow-lg shadow-yellow-500/20"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังโหลด...</>
              ) : (
                authMode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'
              )}
            </Button>

          </form>
          
          {/* Footer / Toggle Mode */}
          <div className="mt-6 text-center pt-6 border-t border-gray-800/50">
            <p className="text-sm text-gray-400">
              {authMode === 'login' ? 'ยังไม่มีบัญชีใช่ไหม?' : 'มีบัญชีอยู่แล้ว?'}
              <button 
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login');
                  setError('');
                }}
                className="ml-2 text-yellow-500 hover:text-yellow-400 font-bold hover:underline transition-colors"
              >
                {authMode === 'login' ? 'สร้างบัญชีใหม่' : 'เข้าสู่ระบบ'}
              </button>
            </p>
          </div>

        </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}