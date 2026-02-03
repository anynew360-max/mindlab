import Header from '../sections/Header';
import Footer from '../sections/Footer';
import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CartProvider, useCart } from '../lib/cart';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, isFirebaseConfigured, storage } from '../lib/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  isNew: boolean;
  description: string;
  firestoreId?: string;
}


function ProductsContent() {
  const [comments, setComments] = useState<{ [productId: number]: string[] }>({});
  const [commentInput, setCommentInput] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<string>('ทั้งหมด');
  const [search, setSearch] = useState<string>('');
  const { addItem, items } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [pendingEdits, setPendingEdits] = useState<{ [id: number]: Product }>({});
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    if (isFirebaseConfigured) {
      const colRef = collection(db, 'products');
      unsub = onSnapshot(colRef, (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          firestoreId: d.id,
          ...(d.data() as Product),
        }));
        setProducts(data as Product[]);
        setIsLoading(false);
      });
    } else {
      const storedProducts = localStorage.getItem('products');
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
        setIsLoading(false);
      } else {
        fetch('/data/products.json')
          .then((res) => res.json())
          .then((data) => {
            setProducts(data.products);
            setIsLoading(false);
          })
          .catch(() => setIsLoading(false));
      }
    }

    // Load user
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) setUser(JSON.parse(storedUser));

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const handleAddComment = () => {
    if (!selectedProduct || !commentInput.trim()) return;
    setComments((prev) => ({
      ...prev,
      [selectedProduct.id]: [...(prev[selectedProduct.id] || []), commentInput.trim()]
    }));
    setCommentInput('');
  };

  const addToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
  };

  const updateProduct = async (updatedProduct: Product) => {
    if (isFirebaseConfigured && updatedProduct.firestoreId) {
      const { firestoreId, ...payload } = updatedProduct;
      await updateDoc(doc(db, 'products', firestoreId), payload);
      return;
    }

    const idx = products.findIndex(p => p.id === updatedProduct.id);
    if (idx === -1) return;
    const updated = [...products];
    updated[idx] = { ...updatedProduct };
    setProducts(updated);
    localStorage.setItem('products', JSON.stringify(updated));
  };

  const getImageFromFile = async (file: File) => {
    if (!isFirebaseConfigured) {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('File read error'));
        reader.readAsDataURL(file);
      });
    }

    const fileRef = ref(storage, `products/${Date.now()}-${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };


  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const categories = ['ทั้งหมด', 'Pokemon', 'Battle of Talingchan'];
  let filteredProducts = category === 'ทั้งหมด' ? products : products.filter(p => p.category === category);
  
  if (search.trim() !== '') {
    const s = search.trim().toLowerCase();
    filteredProducts = filteredProducts.filter(p =>
      p.name.toLowerCase().includes(s) ||
      (p.description && p.description.toLowerCase().includes(s))
    );
  }



  if (isLoading) {
    return <div className="py-12 text-center text-yellow-500">กำลังโหลดสินค้า...</div>;
  }

  return (
    <>
      <section className="w-full pt-10 pb-4 bg-gray-950 min-h-screen">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2 text-center drop-shadow">สินค้าทั้งหมด</h2>
          <p className="text-gray-400 text-center mb-8">เลือกดูสินค้าและอุปกรณ์การ์ดเกมจากทุกหมวดหมู่</p>
          <div className="bg-gray-900/95 rounded-xl shadow-lg p-4 md:p-6 mb-8 flex flex-col items-center gap-4 border border-yellow-500/30">
            <div className="flex flex-wrap gap-2 justify-center w-full">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={cat === category ? 'default' : 'outline'}
                  className={cat === category ? 'bg-yellow-500 text-gray-900' : 'border-yellow-500 text-yellow-500 hover:bg-yellow-500/10'}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
            <div className="flex justify-center w-full max-w-md">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ค้นหาสินค้า..."
                className="w-full px-4 py-2 rounded-lg border border-yellow-500 bg-gray-950 text-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder:text-yellow-600"
              />
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center text-gray-400 py-16 text-xl">ไม่พบสินค้าในหมวดนี้</div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
              style={{
                maxHeight: '70vh',
                overflowY: 'auto',
                paddingBottom: '1rem',
                marginBottom: '1rem',
              }}
            >
              {filteredProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className="group bg-gray-900 rounded-2xl shadow-lg hover:shadow-yellow-500/10 transition-all duration-300 overflow-hidden border border-yellow-600/20 flex flex-col cursor-pointer"
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowDetail(true);
                  }}
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-gray-800">
                    <img
                      src={pendingEdits[product.id]?.image || product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = '/images/placeholder.svg';
                      }}
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {product.isNew && <Badge className="bg-yellow-500 text-gray-900 font-bold">ใหม่</Badge>}
                    </div>
                    {user && user.role === 'admin' && (
                      <Button size="sm" className="absolute bottom-3 right-3 bg-yellow-500 text-black font-bold shadow" onClick={e => { e.stopPropagation(); setEditIndex(idx); setEditData({ ...pendingEdits[product.id] || product }); }}>
                        แก้ไขสินค้า
                      </Button>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    {editIndex === idx ? (
                      <>
                        <input className="mb-2 w-full bg-gray-800 border border-yellow-500 rounded px-2 py-1 text-white" value={editData.name} onChange={e => setEditData((prev: any) => ({ ...prev, name: e.target.value }))} />
                        <input className="mb-2 w-full bg-gray-800 border border-yellow-500 rounded px-2 py-1 text-white" type="number" value={editData.price} onChange={e => setEditData((prev: any) => ({ ...prev, price: Number(e.target.value) }))} />
                        <textarea className="mb-2 w-full bg-gray-800 border border-yellow-500 rounded px-2 py-1 text-white" value={editData.description} onChange={e => setEditData((prev: any) => ({ ...prev, description: e.target.value }))} />
                        <input type="file" accept="image/*" className="mb-2" onChange={async e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const imageUrl = await getImageFromFile(file);
                          setEditData((prev: any) => ({ ...prev, image: imageUrl }));
                        }} />
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-yellow-500 text-black" onClick={async () => {
                            const updatedProduct = { ...editData } as Product;
                            await updateProduct(updatedProduct);
                            setPendingEdits(prev => {
                              const next = { ...prev };
                              delete next[product.id];
                              return next;
                            });
                            setEditIndex(null);
                          }}>บันทึกสินค้า</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditIndex(null)}>ยกเลิก</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-white mb-2 line-clamp-2">{pendingEdits[product.id]?.name || product.name}</h3>
                        <div className="mt-auto">
                          <span className="text-xl font-bold text-yellow-500">{formatPrice(pendingEdits[product.id]?.price || product.price)}</span>
                          <Button 
                            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                            className="w-full mt-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {items.some(i => i.id === product.id) ? 'เพิ่มแล้ว' : 'ใส่ตะกร้า'}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
          {user && user.role === 'admin' && Object.keys(pendingEdits).length > 0 && (
            <div className="flex justify-end mt-6">
              <Button className="bg-green-500 text-white font-bold px-6 py-2 rounded-xl" onClick={async () => {
                const updated = products.map(p => pendingEdits[p.id] ? pendingEdits[p.id] : p);
                for (const product of updated) {
                  if (pendingEdits[product.id]) {
                    await updateProduct(product);
                  }
                }
                setProducts(updated);
                if (!isFirebaseConfigured) {
                  localStorage.setItem('products', JSON.stringify(updated));
                }
                setPendingEdits({});
              }}>
                บันทึกทั้งหมด
              </Button>
            </div>
          )}
            </div>
          )}
        </div>
      </section>

      {/* Improved Dialog Section */}
      <Dialog open={showDetail} onOpenChange={(open) => { setShowDetail(open); if (!open) setSelectedProduct(null); }}>
        <DialogContent className="w-[95vw] max-w-3xl md:max-w-4xl flex flex-row items-stretch p-0 bg-[#111827] rounded-3xl shadow-2xl border border-yellow-500/30">
          {/* Close Button */}
          <button
            onClick={() => setShowDetail(false)}
            className="absolute top-4 right-4 z-50 bg-gray-900/50 hover:bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center backdrop-blur-md transition-all border border-white/10"
          >
            ×
          </button>
          {selectedProduct && (
            <>
              {/* Left: Image */}
              <div className="flex-shrink-0 flex flex-col items-center justify-center p-8 bg-gray-800/30 w-[260px] min-w-[180px] max-w-[320px]">
                <img
                  src={editIndex === null ? selectedProduct.image : editData.image}
                  alt={selectedProduct.name}
                  className="object-contain w-full max-h-[350px] rounded-xl border border-yellow-500/20 shadow"
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholder.svg';
                  }}
                />
                {user && user.role === 'admin' && editIndex !== null && (
                  <input type="file" accept="image/*" className="mt-2" onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const imageUrl = await getImageFromFile(file);
                    setEditData((prev: any) => ({ ...prev, image: imageUrl }));
                  }} />
                )}
              </div>
              {/* Right: Details */}
              <div className="flex-1 min-w-0 flex flex-col p-8 bg-gray-900/80 border-l border-gray-800 overflow-y-auto">
                <div className="flex flex-col gap-2">
                  <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 mb-2 px-3 py-1 w-fit">
                    {editIndex === null ? selectedProduct.category : editData.category}
                  </Badge>
                  <DialogHeader className="text-left p-0 mb-2">
                    <DialogTitle className="text-2xl md:text-3xl font-bold text-white leading-tight">
                      {editIndex === null ? selectedProduct.name : (
                        <input className="bg-gray-800 border border-yellow-500 rounded px-2 py-1 text-white w-full" value={editData.name} onChange={e => setEditData((prev: any) => ({ ...prev, name: e.target.value }))} />
                      )}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-3xl font-extrabold text-yellow-500">
                      {editIndex === null ? formatPrice(selectedProduct.price) : (
                        <input className="bg-gray-800 border border-yellow-500 rounded px-2 py-1 text-white w-24" type="number" value={editData.price} onChange={e => setEditData((prev: any) => ({ ...prev, price: Number(e.target.value) }))} />
                      )}
                    </span>
                    {selectedProduct.originalPrice && (
                      <span className="text-lg text-gray-500 line-through">
                        {formatPrice(selectedProduct.originalPrice)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-base leading-relaxed mb-4">
                    {editIndex === null ? selectedProduct.description : (
                      <textarea className="bg-gray-800 border border-yellow-500 rounded px-2 py-1 text-white w-full" value={editData.description} onChange={e => setEditData((prev: any) => ({ ...prev, description: e.target.value }))} />
                    )}
                  </p>
                  {user && user.role === 'admin' && editIndex === null && (
                    <Button size="sm" className="bg-yellow-500 text-black font-bold mb-2" onClick={() => { setEditIndex(selectedProduct.id); setEditData({ ...selectedProduct }); }}>
                      แก้ไขสินค้า
                    </Button>
                  )}
                  {editIndex === selectedProduct?.id && (
                    <div className="flex gap-2 mb-2">
                      <Button size="sm" className="bg-yellow-500 text-black" onClick={async () => {
                        const updatedProduct = { ...editData } as Product;
                        await updateProduct(updatedProduct);
                        setEditIndex(null);
                        setSelectedProduct(updatedProduct);
                        setShowDetail(false);
                      }}>บันทึกสินค้า</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditIndex(null)}>ยกเลิก</Button>
                    </div>
                  )}
                  <Button
                    onClick={() => addToCart(selectedProduct)}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-4 text-lg rounded-2xl shadow mb-4 transition-transform active:scale-95"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {items.some((i) => i.id === selectedProduct.id) ? 'อยู่ในตะกร้าแล้ว' : 'ใส่ตะกร้าสินค้า'}
                  </Button>
                </div>
                {/* Comment Section */}
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-yellow-500 rounded-full"></span>
                    ความคิดเห็น ({ (comments[selectedProduct.id] || []).length })
                  </h3>
                  <div className="flex gap-2 mb-2">
                    <textarea
                      className="flex-1 rounded-xl border border-gray-700 bg-gray-950 text-white p-2 text-sm focus:border-yellow-500 outline-none transition-all resize-none"
                      rows={2}
                      placeholder="เขียนคำถามหรือความคิดเห็น..."
                      value={commentInput}
                      onChange={e => setCommentInput(e.target.value)}
                    />
                    <Button
                      className="bg-gray-800 hover:bg-yellow-500 hover:text-gray-900 text-yellow-500 font-bold px-4 rounded-xl"
                      onClick={handleAddComment}
                    >
                      ส่ง
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                    {(comments[selectedProduct.id] || []).length === 0 ? (
                      <p className="text-gray-500 text-sm italic">ร่วมเป็นคนแรกที่แสดงความคิดเห็น...</p>
                    ) : (
                      comments[selectedProduct.id].map((c, i) => (
                        <div key={i} className="bg-gray-800/40 rounded-xl p-3 text-gray-300 text-sm border border-gray-700/50">
                          {c}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}


function FooterWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', zIndex: 50 }}>
      {children}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <CartProvider>
      <Header />
      <ProductsContent />
      <FooterWrapper>
        <Footer />
      </FooterWrapper>
    </CartProvider>
  );
}