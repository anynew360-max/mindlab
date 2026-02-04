import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Image as ImageIcon, 
  Save, 
  ChevronLeft,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, setDoc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { db, isFirebaseConfigured, storage } from '@/lib/firebase';
import { getImageUrl } from '@/lib/utils';

type Product = {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  status: string;
  isPreOrder: boolean;
  description: string;
  image?: string;
  firestoreId?: string;
};

type ProductFormData = Omit<Product, 'id'>;

type MenuItemProps = {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string | number;
};

export default function AdminProductManager() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('products');
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const sortById = (a: Product, b: Product) => a.id - b.id;
  const lastIdsRef = useRef('');
  const hasSeededRef = useRef(false);
  const allowEmptyRef = useRef(false);
  const productsRef = useRef<Product[]>([]);

  const applyProducts = (next: Product[]) => {
    const ids = next.map((p) => p.id).join(',');
    if (ids === lastIdsRef.current) return;
    lastIdsRef.current = ids;
    setProducts(next);
  };

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    const seedFromJson = async () => {
      try {
        const res = await fetch('/data/products.json');
        const data = await res.json();
        const items: Product[] = Array.isArray(data.products) ? data.products : [];
        applyProducts([...items].sort(sortById));
        hasSeededRef.current = true;

        if (!isFirebaseConfigured) return;
        await Promise.all(
          items.map((item) =>
            setDoc(doc(db, 'products', String(item.id)), {
              ...item,
              id: item.id,
            })
          )
        );
      } catch {
        // ignore
      }
    };

    if (!isFirebaseConfigured) {
      const stored = localStorage.getItem('products');
      if (stored) {
        applyProducts((JSON.parse(stored) as Product[]).slice().sort(sortById));
        return;
      }
      seedFromJson();
      return;
    }

    const q = query(collection(db, 'products'), orderBy('id', 'asc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setRealtimeError(null);
        if (snapshot.empty) {
          if (allowEmptyRef.current) {
            applyProducts([]);
            return;
          }
          if (!hasSeededRef.current && productsRef.current.length === 0) {
            seedFromJson();
          }
          return;
        }
        const data = snapshot.docs.map((d) => ({
          firestoreId: d.id,
          ...(d.data() as Product),
        }));
        allowEmptyRef.current = false;
        applyProducts((data as Product[]).slice().sort(sortById));
        hasSeededRef.current = true;
      },
      (error) => {
        console.error('Realtime products error:', error);
        setRealtimeError('ไม่สามารถอ่านข้อมูลแบบเรียลไทม์ได้ กรุณาตรวจสอบ Firestore Rules');
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    const loadOrders = () => {
      const storedOrders = localStorage.getItem('orders');
      const orders = storedOrders ? JSON.parse(storedOrders) : [];
      setOrderCount(Array.isArray(orders) ? orders.length : 0);
    };

    loadOrders();
    const handleUpdate = () => loadOrders();
    window.addEventListener('orders-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('orders-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleAddNew = () => {
    setEditingProduct(null);
    setView('form');
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setView('form');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?')) return;

    if (products.length <= 1) {
      allowEmptyRef.current = true;
    }

    if (isFirebaseConfigured) {
      const target = products.find((p) => p.id === id);
      if (target?.firestoreId) {
        await deleteDoc(doc(db, 'products', target.firestoreId));
      }
      return;
    }

    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    localStorage.setItem('products', JSON.stringify(updated));
  };

  const handleDeleteAll = async () => {
    if (!confirm('ต้องการลบสินค้าทั้งหมดจริงหรือไม่?')) return;
    if (!confirm('ยืนยันอีกครั้ง: การลบนี้ย้อนกลับไม่ได้')) return;

    allowEmptyRef.current = true;

    if (isFirebaseConfigured) {
      const snapshot = await getDocs(collection(db, 'products'));
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
      setProducts([]);
      return;
    }

    setProducts([]);
    localStorage.removeItem('products');
  };

  const handleSave = async (formData: ProductFormData) => {
    if (isFirebaseConfigured) {
      try {
        if (editingProduct?.firestoreId) {
          const { firestoreId, ...payload } = { ...formData, id: editingProduct.id } as Product;
          await updateDoc(doc(db, 'products', editingProduct.firestoreId), payload);
        } else if (editingProduct) {
          const payload = { ...formData, id: editingProduct.id } as Product;
          await setDoc(doc(db, 'products', String(editingProduct.id)), payload, { merge: true });
        } else {
          await addDoc(collection(db, 'products'), {
            ...formData,
            id: Date.now(),
            createdAt: serverTimestamp(),
          });
        }
        setView('list');
      } catch (error) {
        console.error('Failed to save product:', error);
        alert('บันทึกสินค้าไม่สำเร็จ กรุณาตรวจสอบสิทธิ์ Firestore');
      }
      return;
    }

    let updated: Product[];
    if (editingProduct) {
      updated = products.map(p => p.id === editingProduct.id ? { ...formData, id: p.id } : p);
    } else {
      updated = [...products, { ...formData, id: Date.now() }];
    }
    setProducts(updated);
    localStorage.setItem('products', JSON.stringify(updated));
    setView('list');
  };

  const Sidebar = () => (
    <aside className="w-72 bg-[#0f172a] border-r border-slate-800/70 flex flex-col h-screen fixed left-0 top-0 z-20 hidden md:flex">
      <div className="p-7 flex items-center gap-4 border-b border-slate-800/70">
        <div className="bg-amber-500 rounded-xl w-11 h-11 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <ShieldCheck size={26} className="text-[#181c2a]" />
        </div>
        <span className="text-amber-500 font-bold text-xl tracking-widest">ADMIN</span>
      </div>
      <nav className="flex-1 p-5 space-y-2.5">
        <MenuItem
          icon={<Package size={20} />}
          label="จัดการสินค้า"
          active={location.pathname === '/admin/products'}
          onClick={() => {
            setActiveTab('products');
            navigate('/admin/products');
          }}
        />
        <MenuItem
          icon={<ShoppingCart size={20} />}
          label="คำสั่งซื้อ"
          active={location.pathname === '/admin/orders'}
          onClick={() => navigate('/admin/orders')}
          badge={orderCount}
        />
      </nav>
      <div className="p-5 border-t border-slate-800/70 mt-auto">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-3 text-slate-300 hover:text-white w-full px-4 py-3 rounded-xl hover:bg-slate-800/60 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>ย้อนกลับหน้าหลัก</span>
        </button>
      </div>
    </aside>
  );

  const MenuItem = ({ icon, label, active, onClick, badge }: MenuItemProps) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
        active 
          ? 'bg-amber-500 text-[#181c2a] font-bold shadow-md shadow-amber-500/20' 
          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`${active ? 'text-[#10131c]' : 'text-slate-300'}`}>{icon}</span>
        <span className="text-sm md:text-base">{label}</span>
      </div>
      {badge !== undefined && badge !== null && badge !== '' && Number(badge) > 0 && (
        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">{badge}</span>
      )}
    </button>
  );

  const ProductList = () => (
    <div className="animate-fade-in">
      {realtimeError && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {realtimeError}
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-3">จัดการสินค้า</h1>
          <p className="text-[#bfc8e6] text-sm">สินค้าทั้งหมด {products.length} รายการ</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDeleteAll}
            className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2.5 rounded-lg font-bold transition-all border border-red-500/40"
          >
            <Trash2 size={18} />
            <span>ลบทั้งหมด</span>
          </button>
          <button 
            onClick={handleAddNew}
            className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-400 text-[#10131c] px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-yellow-500/20"
          >
            <Plus size={20} />
            <span>เพิ่มสินค้าใหม่</span>
          </button>
        </div>
      </div>
      <div className="bg-[#181c2a] p-4 rounded-xl border border-[#23263a] mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bfc8e6]" size={18} />
          <input 
            type="text" 
            placeholder="ค้นหาชื่อสินค้า, SKU..." 
            className="w-full pl-10 pr-4 py-2 bg-[#10131c] border border-[#23263a] rounded-lg text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-colors"
          />
        </div>
        <select className="bg-[#10131c] border border-[#23263a] text-[#bfc8e6] rounded-lg px-4 py-2 focus:outline-none focus:border-yellow-500">
          <option>ทุกหมวดหมู่</option>
          <option>Pokemon</option>
          <option>Battle of Talingchan</option>
          <option>Accessories</option>
        </select>
        <select className="bg-[#10131c] border border-[#23263a] text-[#bfc8e6] rounded-lg px-4 py-2 focus:outline-none focus:border-yellow-500">
          <option>สถานะทั้งหมด</option>
          <option>พร้อมส่ง</option>
          <option>Pre-order</option>
          <option>สินค้าหมด</option>
        </select>
      </div>
      <div className="bg-[#10131c] rounded-xl border border-[#23263a] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#181c2a] text-[#bfc8e6] text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">รูปภาพ</th>
                <th className="p-4 font-medium">ชื่อสินค้า</th>
                <th className="p-4 font-medium">หมวดหมู่</th>
                <th className="p-4 font-medium">ราคา</th>
                <th className="p-4 font-medium text-center">สต็อก</th>
                <th className="p-4 font-medium text-center">สถานะ</th>
                <th className="p-4 font-medium text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#23263a] text-[#bfc8e6]">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-[#23263a] transition-colors group">
                  <td className="p-4">
                    <div className="w-12 h-12 bg-[#181c2a] rounded-lg flex items-center justify-center overflow-hidden border border-[#23263a]">
                      {product.image ? (
                        <img
                          src={getImageUrl(product.image)}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/images/placeholder.svg';
                          }}
                        />
                      ) : (
                        <ImageIcon className="text-[#23263a]" size={20} />
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-white group-hover:text-yellow-500 transition-colors">{product.name}</div>
                    <div className="text-xs text-[#bfc8e6] mt-1">SKU: {product.sku}</div>
                    {product.isPreOrder && (
                      <span className="inline-block mt-1 text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30">
                        PRE-ORDER
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="bg-[#181c2a] text-[#bfc8e6] px-2 py-1 rounded text-xs border border-[#23263a]">
                      {product.category}
                    </span>
                  </td>
                  <td className="p-4 text-yellow-400 font-medium">฿{product.price.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    {product.stock === 0 ? (
                      <span className="text-red-500 font-bold">หมด</span>
                    ) : (
                      product.stock
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      product.status === 'active' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : 'bg-slate-700 text-slate-400 border-slate-600'
                    }`}>
                      {product.status === 'active' ? 'เปิดขาย' : <span className="text-red-400">ปิดการมองเห็น</span>}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleEdit(product)}
                        className="p-2 text-[#bfc8e6] hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-[#bfc8e6] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const ProductForm = () => {
    const [formData, setFormData] = useState<ProductFormData>({
      name: editingProduct?.name || '',
      sku: editingProduct?.sku || '',
      price: editingProduct?.price || 0,
      stock: editingProduct?.stock || 0,
      category: editingProduct?.category || 'Pokemon',
      status: editingProduct?.status || 'active',
      isPreOrder: editingProduct?.isPreOrder || false,
      description: editingProduct?.description || '',
      image: editingProduct?.image || ''
    });
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [imageError, setImageError] = useState<string | null>(null);

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const target = e.target;
      const isCheckbox = target instanceof HTMLInputElement && target.type === 'checkbox';
      const nextValue = isCheckbox ? target.checked : target.value;
      setFormData(prev => ({
        ...prev,
        [target.name]: nextValue
      }));
    };

    const resizeImage = async (file: File, maxSize = 1200, quality = 0.8) => {
      if (!file.type.startsWith('image/')) return file;
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('File read error'));
        reader.readAsDataURL(file);
      });

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Image load error'));
        image.src = dataUrl;
      });

      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.drawImage(img, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', quality)
      );
      if (!blob) return file;
      return new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' });
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImageError(null);
      setUploadProgress(0);

      if (!isFirebaseConfigured) {
        const reader = new FileReader();
        reader.onload = () => {
          setFormData((prev) => ({ ...prev, image: String(reader.result) }));
        };
        reader.readAsDataURL(file);
        return;
      }

      try {
        setIsUploadingImage(true);
        const resized = await resizeImage(file);
        const fileRef = ref(storage, `products/${Date.now()}-${resized.name}`);
        const uploadTask = uploadBytesResumable(fileRef, resized, {
          contentType: resized.type,
          cacheControl: 'public, max-age=31536000',
        });

        const url = await new Promise<string>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setUploadProgress(progress);
            },
            (error) => reject(error),
            async () => {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadUrl);
            }
          );
        });
        setFormData((prev) => ({ ...prev, image: url }));
      } catch (error) {
        console.error('Failed to upload image:', error);
        setImageError('อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่');
      } finally {
        setIsUploadingImage(false);
      }
    };

    const handleRemoveImage = () => {
      setFormData((prev) => ({ ...prev, image: '' }));
    };

    return (
      <div className="animate-fade-in max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <button 
            onClick={() => setView('list')}
            className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">กรอกข้อมูลสินค้าให้ครบถ้วนเพื่อแสดงผลหน้าร้าน</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">ข้อมูลทั่วไป</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">ชื่อสินค้า <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
                    placeholder="เช่น Starter Deck ex เมก้าลูคาริโอ"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-sm mb-1">SKU / รหัสสินค้า</label>
                    <input 
                      type="text" 
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-yellow-500 outline-none"
                      placeholder="PKM-001"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-1">หมวดหมู่</label>
                    <select 
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-yellow-500 outline-none"
                    >
                      <option>Pokemon</option>
                      <option>Battle of Talingchan</option>
                      <option>One Piece</option>
                      <option>Accessories</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">รายละเอียดสินค้า</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-yellow-500 outline-none resize-none"
                    placeholder="รายละเอียดการ์ด, ความสามารถ, สิ่งที่จะได้รับในกล่อง..."
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">ราคาและคลังสินค้า</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">ราคาปกติ (บาท)</label>
                  <input 
                    type="number" 
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-yellow-500 outline-none text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">จำนวนในสต็อก</label>
                  <input 
                    type="number" 
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-yellow-500 outline-none text-right font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
             <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">การตั้งค่า</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <span className="text-white text-sm">สถานะการขาย</span>
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleChange}
                    className="bg-slate-900 text-white text-sm rounded px-2 py-1 border border-slate-600 focus:border-yellow-500 outline-none"
                  >
                    <option value="active">เปิดขาย</option>
                    <option value="draft">ฉบับร่าง</option>
                    <option value="archived">ปิดถาวร</option>
                  </select>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-yellow-500/50 transition-colors cursor-pointer" onClick={() => setFormData({...formData, isPreOrder: !formData.isPreOrder})}>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.isPreOrder ? 'bg-yellow-500 border-yellow-500' : 'border-slate-500'}`}>
                    {formData.isPreOrder && <span className="text-black font-bold text-xs">✓</span>}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">สินค้า Pre-order</div>
                    <div className="text-xs text-slate-500">ติ๊กเพื่อแสดงป้าย Pre-order และเปลี่ยนปุ่มซื้อ</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">รูปภาพสินค้า</h3>
              <label className="border-2 border-dashed border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-yellow-500/50 hover:bg-slate-800/50 transition-all cursor-pointer group">
                {formData.image ? (
                  <img
                    src={getImageUrl(formData.image)}
                    alt="preview"
                    className="w-40 h-40 object-cover rounded-xl mb-4 border border-slate-700"
                    onError={(e) => {
                      e.currentTarget.src = '/images/placeholder.svg';
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <ImageIcon className="text-slate-500 group-hover:text-yellow-500" size={32} />
                  </div>
                )}
                <p className="text-slate-300 font-medium">ลากไฟล์มาวาง หรือ คลิกเพื่อเลือกรูป</p>
                <p className="text-slate-500 text-xs mt-2">รองรับ JPG, PNG (ขนาดแนะนำ 800x800px)</p>
                {isUploadingImage && (
                  <p className="text-yellow-500 text-xs mt-2">กำลังอัปโหลดรูป... {uploadProgress}%</p>
                )}
                {imageError && (
                  <p className="text-red-400 text-xs mt-2">{imageError}</p>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
              {formData.image && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="mt-3 w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-lg transition-colors border border-slate-700"
                >
                  ลบรูปภาพ
                </button>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleSave(formData)}
                disabled={isUploadingImage}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-3 rounded-lg shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center space-x-2"
              >
                <Save size={20} />
                <span>บันทึกสินค้า</span>
              </button>
              <button 
                onClick={() => setView('list')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-lg transition-colors border border-slate-700"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-yellow-500/30">
      <Sidebar />
      <div className="md:ml-72 min-h-screen flex flex-col md:pl-2">
        <div className="md:hidden bg-slate-900 p-4 flex justify-between items-center border-b border-slate-800">
          <div className="text-amber-500 font-bold flex items-center gap-2">
            <ShieldCheck /> ADMIN
          </div>
          
        </div>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {view === 'list' && activeTab === 'products' ? (
            <ProductList />
          ) : view === 'form' ? (
            <ProductForm />
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-slate-500">
               <Package size={48} className="mb-4 opacity-50"/>
               <p>หน้านี้อยู่ระหว่างพัฒนา</p>
               <button onClick={() => setActiveTab('products')} className="text-yellow-500 mt-2 underline">ไปที่หน้าสินค้า</button>
             </div>
           )}
        </main>
      </div>
    </div>
  );
}
