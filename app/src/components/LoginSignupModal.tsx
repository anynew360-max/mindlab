import { useState } from 'react';
import { Mail, Lock, User, Phone, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';

interface LoginSignupModalProps {
  children: React.ReactNode;
}

export const LoginSignupModal = ({ children }: LoginSignupModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, signup, error } = useAuth();

  // Login form
  const [loginData, setLoginData] = useState({
    email: 'demo@example.com',
    password: 'password123',
  });

  // Signup form
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setLoading(true);

    try {
      await login(loginData.email, loginData.password);
      // Modal will close automatically after login success
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!signupData.name.trim()) {
      setValidationError('กรุณากรอกชื่อ');
      return;
    }
    if (!signupData.email.trim()) {
      setValidationError('กรุณากรอกอีเมล');
      return;
    }
    if (!signupData.password) {
      setValidationError('กรุณากรอกรหัสผ่าน');
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      setValidationError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);
    try {
      await signup(
        signupData.name,
        signupData.email,
        signupData.password,
        signupData.phone
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="bg-gradient-to-b from-gray-900 to-gray-950 border-yellow-600/30 w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="border-b border-yellow-600/30 pb-4">
          <SheetTitle className="text-yellow-500 text-2xl font-bold text-left">
            {isLogin ? '🔐 เข้าสู่ระบบ' : '✨ สร้างบัญชี'}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Error Message */}
          {(error || validationError) && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex gap-2 items-start">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error || validationError}</p>
            </div>
          )}

          {/* Demo Credentials Info */}
          {isLogin && (
            <div className="p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 text-xs space-y-1">
              <p>💡 ทดลองใช้งาน:</p>
              <p>👤 Demo: demo@example.com / password123</p>
              <p>👑 Admin: admin@example.com / admin123</p>
            </div>
          )}

          {isLogin ? (
            // Login Form
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-yellow-400 font-semibold mb-2 text-sm">
                  อีเมล
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-yellow-500" />
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) =>
                      setLoginData({ ...loginData, email: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800/60 border-2 border-yellow-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition"
                    placeholder="your@email.com"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-yellow-400 font-semibold mb-2 text-sm">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-yellow-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-800/60 border-2 border-yellow-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition"
                    placeholder="••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-yellow-500 hover:text-yellow-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-500 via-yellow-500 to-yellow-600 hover:from-yellow-400 hover:via-yellow-400 hover:to-yellow-500 text-gray-900 font-bold py-3 rounded-lg transition disabled:opacity-50 mt-6"
              >
                {loading ? '⏳ กำลังเข้าสู่ระบบ...' : '✓ เข้าสู่ระบบ'}
              </Button>

              <div className="text-center text-gray-400 text-sm pt-4 border-t border-gray-700">
                ยังไม่มีบัญชี?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setValidationError(null);
                  }}
                  className="text-yellow-400 hover:text-yellow-300 font-semibold transition"
                >
                  สร้างบัญชีใหม่
                </button>
              </div>
            </form>
          ) : (
            // Signup Form
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-yellow-400 font-semibold mb-2 text-sm">
                  ชื่อ
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-yellow-500" />
                  <input
                    type="text"
                    value={signupData.name}
                    onChange={(e) =>
                      setSignupData({ ...signupData, name: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800/60 border-2 border-yellow-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition"
                    placeholder="ชื่อของคุณ"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-yellow-400 font-semibold mb-2 text-sm">
                  อีเมล
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-yellow-500" />
                  <input
                    type="email"
                    value={signupData.email}
                    onChange={(e) =>
                      setSignupData({ ...signupData, email: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800/60 border-2 border-yellow-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition"
                    placeholder="your@email.com"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-yellow-400 font-semibold mb-2 text-sm">
                  เบอร์โทรศัพท์ (ไม่บังคับ)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-yellow-500" />
                  <input
                    type="tel"
                    value={signupData.phone}
                    onChange={(e) =>
                      setSignupData({ ...signupData, phone: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800/60 border-2 border-yellow-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition"
                    placeholder="0812345678"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-yellow-400 font-semibold mb-2 text-sm">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-yellow-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signupData.password}
                    onChange={(e) =>
                      setSignupData({ ...signupData, password: e.target.value })
                    }
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-800/60 border-2 border-yellow-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition"
                    placeholder="••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-yellow-500 hover:text-yellow-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-yellow-400 font-semibold mb-2 text-sm">
                  ยืนยันรหัสผ่าน
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-yellow-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signupData.confirmPassword}
                    onChange={(e) =>
                      setSignupData({
                        ...signupData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-800/60 border-2 border-yellow-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition"
                    placeholder="••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-yellow-500 hover:text-yellow-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-500 via-yellow-500 to-yellow-600 hover:from-yellow-400 hover:via-yellow-400 hover:to-yellow-500 text-gray-900 font-bold py-3 rounded-lg transition disabled:opacity-50 mt-6"
              >
                {loading ? '⏳ กำลังสร้างบัญชี...' : '✓ สร้างบัญชี'}
              </Button>

              <div className="text-center text-gray-400 text-sm pt-4 border-t border-gray-700">
                มีบัญชีแล้ว?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setValidationError(null);
                  }}
                  className="text-yellow-400 hover:text-yellow-300 font-semibold transition"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
