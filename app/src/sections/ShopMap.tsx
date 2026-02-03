import { MapPin, Navigation, Clock, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ShopMap = () => {
  return (
    <section className="w-full py-12 bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-500 px-4 py-2 rounded-full mb-4 border border-yellow-500/30">
              <MapPin className="w-5 h-5" />
              <span className="font-semibold">แผนที่ร้าน</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              มาเยี่ยมร้านของเรา
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              ร้านตั้งอยู่ใจกลางเมืองลำปาง เดินทางสะดวก มีที่จอดรถหน้าร้าน
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Map Placeholder */}
            <div className="lg:col-span-2">
              <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-yellow-600/20">
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative flex items-center justify-center">
                  {/* Map Mockup */}
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&h=600&fit=crop')] bg-cover bg-center opacity-30" />
                  
                  {/* Map Overlay */}
                  <div className="relative z-10 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/30 mx-auto mb-4 animate-bounce">
                      <MapPin className="w-10 h-10 text-gray-900" />
                    </div>
                    <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl px-6 py-4 shadow-2xl border border-yellow-600/30">
                      <h3 className="font-bold text-yellow-500 text-lg">Mindlab</h3>
                      <p className="text-gray-300">Boardgames & Card Games Lampang</p>
                    </div>
                  </div>

                  {/* Navigation Button Overlay */}
                  <a
                    href="https://www.google.com/maps/place/MINDLAB+board+games+and+card+games+Lampang/@18.2851179,99.4779209,17z/data=!3m1!4b1!4m6!3m5!1s0x30d96b2d38dc71cb:0x68155378c49bf7b9!8m2!3d18.2851179!4d99.4779209!16s%2Fg%2F11xtzd84kd!18m1!1e1?entry=ttu&g_ep=EgoyMDI2MDEyNi4wIKXMDSoKLDEwMDc5MjA3MUgBUAM%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-4 right-4"
                  >
                    <Button className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold shadow-lg">
                      <Navigation className="w-4 h-4 mr-2" />
                      นำทาง
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Info Card */}
            <div className="lg:col-span-1">
              <div className="bg-gray-900 rounded-2xl shadow-2xl p-6 border border-yellow-600/20 h-full">
                <h3 className="font-bold text-xl text-white mb-6">ข้อมูลร้าน</h3>
                
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-yellow-500/30">
                      <MapPin className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">ที่อยู่</p>
                      <p className="text-gray-400 text-sm">
                        25/28-29 ถนนสุเรนทร์<br />
                        ตำบลสบตุ๋ย อำเภอเมือง<br />
                        จังหวัดลำปาง 52100
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-yellow-500/30">
                      <Clock className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">เวลาทำการ</p>
                      <p className="text-gray-400 text-sm">
                        จันทร์ - อาทิตย์<br />
                        11:30 - 19:00 น.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-yellow-500/30">
                      <Phone className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">ติดต่อ</p>
                      <p className="text-gray-400 text-sm">
                        088-268-5394<br />
                        mindlablampang@gmail.com
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-yellow-600/20">
                  <p className="text-sm text-gray-500 mb-4">
                    <strong className="text-yellow-500">การเดินทาง:</strong><br />
                    - ใกล้กับโรงเรียนลำปางวิทยา<br />
                    - มีที่จอดรถหน้าร้าน
                  </p>
                  <a
                    href="https://www.google.com/maps/place/MINDLAB+board+games+and+card+games+Lampang/@18.2851179,99.4779209,17z/data=!3m1!4b1!4m6!3m5!1s0x30d96b2d38dc71cb:0x68155378c49bf7b9!8m2!3d18.2851179!4d99.4779209!16s%2Fg%2F11xtzd84kd!18m1!1e1?entry=ttu&g_ep=EgoyMDI2MDEyNi4wIKXMDSoKLDEwMDc5MjA3MUgBUAM%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 font-bold">
                      <Navigation className="w-4 h-4 mr-2" />
                      เปิดใน Google Maps
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShopMap;
