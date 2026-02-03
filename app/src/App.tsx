import Header from './sections/Header';
import PromotionBanner from './sections/PromotionBanner';
import NewArrivals from './sections/NewArrivals';
import TableReservation from './sections/TableReservation';
import ShopMap from './sections/ShopMap';
import Footer from './sections/Footer';
import { CartProvider } from './lib/cart';
import './App.css';

function App() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main>
          <PromotionBanner />
          <NewArrivals />
          <TableReservation />
          <ShopMap />
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}

export default App;
