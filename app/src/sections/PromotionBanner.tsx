import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Tag, Percent, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoginSignupModal } from '@/components/LoginSignupModal';
import { useAuth } from '@/hooks/useAuth';

const promotionStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(234, 179, 8, 0.3);
    }
    50% {
      box-shadow: 0 0 40px rgba(234, 179, 8, 0.6);
    }
  }

  .animate-in-up {
    animation: fadeInUp 0.6s ease-out;
  }

  .animate-in-right {
    animation: slideInRight 0.6s ease-out;
  }

  .pulse-glow {
    animation: pulse-glow 3s ease-in-out infinite;
  }
`;

interface Promotion {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  discount: string;
  code: string;
}

const PromotionBanner = () => {
  // Inject animation styles
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = promotionStyles;
      document.head.appendChild(style);
      return () => document.head.removeChild(style);
    }
  }, []);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/data/products.json')
      .then((res) => res.json())
      .then((data) => {
        setPromotions(data.promotions || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error loading promotions:', err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (promotions.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [promotions.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % promotions.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
  };

  if (isLoading || promotions.length === 0) {
    return (
      <section className="w-full py-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto px-4">
          <div className="h-64 bg-yellow-500/10 rounded-2xl animate-pulse" />
        </div>
      </section>
    );
  }

  const currentPromo = promotions[currentIndex];

  return (
  <section id="home" className="w-full py-10 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
    <div className="container mx-auto px-4">
      <div className="relative overflow-hidden rounded-[2rem] shadow-2xl border border-yellow-600/20 bg-gray-950/50">
        
        {/* Layout Wrapper: ใช้ flex-col บนมือถือ และ flex-row บนจอใหญ่ */}
        <div className="relative z-10 flex flex-col lg:flex-row items-stretch min-h-[600px]">
          
          {/* ส่วนที่ 1: เนื้อหาข้อความ (Text Content) */}
          <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center order-2 lg:order-1 animate-in-up">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 px-4 py-1 rounded-full font-bold text-sm mb-4 w-fit pulse-glow shadow-lg">
              <Tag className="w-4 h-4" />
              โปรโมชั่นพิเศษ
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight">
              {currentPromo.title}
            </h2>
            <p className="text-xl md:text-2xl text-yellow-400 font-semibold mb-4">
              {currentPromo.subtitle}
            </p>
            <p className="text-white/70 text-lg mb-6 max-w-md">
              {currentPromo.description}
            </p>
            <div className="flex items-center gap-4">
              <div className="bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-yellow-600/30">
                <span className="text-yellow-500/60 text-sm block">รหัสโค้ด</span>
                <p className="text-yellow-400 font-bold text-lg">{currentPromo.code}</p>
              </div>
              <Button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 font-bold px-6 h-12 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/50 hover:scale-105">
                <Percent className="w-4 h-4 mr-2" />
                ใช้โค้ดเลย
              </Button>
            </div>
          </div>

          {/* ส่วนที่ 2: รูปภาพขนาดใหญ่ (Large Image Display) */}
          {/* บังคับความสูงบนจอใหญ่ให้คงที่ เพื่อให้ภาพทั้งสองโปรโมชั่นมีขนาดเท่ากัน */}
          <div className="w-full lg:w-1/2 relative h-[300px] lg:h-[600px] order-1 lg:order-2 animate-in-right overflow-hidden">
            <img 
              src={currentPromo.image} 
              alt={currentPromo.title}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
            />
            {/* Overlay ไล่เฉดสีเพื่อให้รูปกลืนกับพื้นหลังฝั่งข้อความเฉพาะบนจอใหญ่ */}
            <div className="hidden lg:block absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-gray-950/50 to-transparent" />
          </div>
        </div>

        {/* Navigation Arrows (ใช้โค้ดเดิมของคุณได้เลย) */}
        {promotions.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/40 hover:bg-yellow-500/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 border border-white/20 hover:scale-110 hover:shadow-lg hover:shadow-yellow-500/30"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/40 hover:bg-yellow-500/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 border border-white/20 hover:scale-110 hover:shadow-lg hover:shadow-yellow-500/30"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {promotions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer hover:bg-white/60 ${
                    index === currentIndex ? 'bg-yellow-500 w-6 shadow-lg shadow-yellow-500/50' : 'bg-white/40 w-2'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  </section>
);
};

export default PromotionBanner;
