import { useState, useEffect } from 'react';
import { ShoppingCart, Sparkles, Eye, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/cart';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import productsData from '@/data/products.json';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice: number | null;
  image: string;
  isNew: boolean;
  description: string;
}

const NewArrivals = () => {
  const PRODUCTS_CACHE_KEY = 'products_cache_v1';
  const PRODUCTS_CACHE_TTL = 1000 * 60 * 30; // 30 minutes
  const sortById = (a: Product, b: Product) => a.id - b.id;
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const { addItem, items } = useCart();
  const navigate = useNavigate();

  const readCache = () => {
    try {
      const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { data: Product[]; ts: number };
      if (!Array.isArray(parsed.data)) return null;
      if (Date.now() - parsed.ts > PRODUCTS_CACHE_TTL) return null;
      return parsed.data;
    } catch {
      return null;
    }
  };

  const writeCache = (data: Product[]) => {
    try {
      localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let unsub: (() => void) | undefined;

    const cached = readCache();
    if (cached && cached.length > 0) {
      const sortedCached = [...cached].sort(sortById);
      const newProducts = sortedCached.filter((p) => p.isNew);
      setProducts(newProducts.length > 0 ? newProducts : sortedCached);
      setIsLoading(false);
    } else if (productsData.products?.length) {
      const allProducts = [...(productsData.products as Product[])].sort(sortById);
      const newProducts = allProducts.filter((p) => p.isNew);
      setProducts(newProducts.length > 0 ? newProducts : allProducts);
      writeCache(allProducts);
      setIsLoading(false);
    }

    const seedFromJson = async () => {
      try {
        const allProducts: Product[] = Array.isArray(productsData.products) ? productsData.products : [];
        const sorted = [...allProducts].sort(sortById);
        const newProducts = sorted.filter((p) => p.isNew);
        setProducts(newProducts.length > 0 ? newProducts : sorted);
        writeCache(sorted);
        setIsLoading(false);

        if (!isFirebaseConfigured) return;
        await Promise.all(
          allProducts.map((item) =>
            setDoc(doc(db, 'products', String(item.id)), {
              ...item,
              id: item.id,
            })
          )
        );
      } catch (err) {
        console.error('Error loading products:', err);
        setIsLoading(false);
      }
    };

    if (isFirebaseConfigured) {
      const colRef = collection(db, 'products');
      unsub = onSnapshot(colRef, (snapshot) => {
        if (snapshot.empty) {
          seedFromJson();
          return;
        }
        const allProducts = snapshot.docs.map((d) => d.data() as Product);
        const sorted = [...allProducts].sort(sortById);
        const newProducts = sorted.filter((p) => p.isNew);
        setProducts(newProducts.length > 0 ? newProducts : sorted);
        writeCache(sorted);
        setIsLoading(false);
      });
    } else {
      const storedProducts = localStorage.getItem('products');
      let allProducts: Product[] = [];
      if (storedProducts) {
        allProducts = JSON.parse(storedProducts) as Product[];
        const sorted = [...allProducts].sort(sortById);
        writeCache(sorted);
      }
      // fallback to fetch if no localStorage
      if (allProducts.length === 0) {
        seedFromJson();
      } else {
        const sorted = [...allProducts].sort(sortById);
        const newProducts = sorted.filter((p: Product) => p.isNew);
        setProducts(newProducts.length > 0 ? newProducts : sorted);
        setIsLoading(false);
      }
    }

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const addToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
  };

  const toggleFavorite = (productId: number) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <section id="shop" className="w-full py-12 bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="h-8 w-48 bg-yellow-500/20 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 bg-yellow-500/10 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="shop" className="w-full py-12 bg-gray-950">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20 cursor-pointer" onClick={() => navigate('/products')}>
              <Sparkles className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                สินค้ามาใหม่
              </h2>
              <p className="text-yellow-500/70">การ์ดเกมใหม่ล่าสุดที่เพิ่งเข้าร้าน</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="hidden sm:flex border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
            onClick={() => navigate('/products')}
          >
            ดูทั้งหมด
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.slice(0, 4).map((product) => (
            <div
              key={product.id}
              className="group bg-gray-900 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-yellow-500/10 transition-all duration-300 overflow-hidden border border-yellow-600/20"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/5] overflow-hidden bg-gray-800">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholder.svg';
                  }}
                />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 border-0 font-bold">
                    ใหม่
                  </Badge>
                  {product.originalPrice && (
                    <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">
                      ลดราคา
                    </Badge>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
                      favorites.includes(product.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-900/90 text-yellow-500 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${favorites.includes(product.id) ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="w-10 h-10 bg-gray-900/90 rounded-full flex items-center justify-center shadow-lg text-yellow-500 hover:text-yellow-400 transition-all"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>

                {/* Category Badge */}
                <div className="absolute bottom-3 left-3">
                  <Badge variant="secondary" className="bg-gray-900/90 backdrop-blur-sm text-yellow-500 border-yellow-600/30">
                    {product.category}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-white mb-1 line-clamp-2 min-h-[48px]">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-400 mb-3 line-clamp-1">
                  {product.description}
                </p>
                
                {/* Price */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl font-bold text-yellow-500">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>

                {/* Add to Cart Button */}
                <Button
                  onClick={() => addToCart(product)}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 font-bold"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {items.some((i) => i.id === product.id) ? 'เพิ่มแล้ว' : 'ใส่ตะกร้า'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-8 text-center sm:hidden">
          <Button variant="outline" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10">
            ดูทั้งหมด
          </Button>
        </div>
      </div>

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-2xl bg-gray-900 border-yellow-600/30">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">{selectedProduct.name}</DialogTitle>
                <DialogDescription className="text-yellow-500/70">{selectedProduct.category}</DialogDescription>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-800">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <p className="text-gray-300 mb-4">{selectedProduct.description}</p>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl font-bold text-yellow-500">
                        {formatPrice(selectedProduct.price)}
                      </span>
                      {selectedProduct.originalPrice && (
                        <span className="text-lg text-gray-500 line-through">
                          {formatPrice(selectedProduct.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 font-bold"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    ใส่ตะกร้า
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default NewArrivals;
