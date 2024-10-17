import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import WarehousePage from './components/WarehousePage';
import OrdersPage from './components/OrdersPage';
import GoodsPage from './components/GoodsPage';
import UordersPage from './components/UordersPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/warehouse" element={<WarehousePage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/uorders" element={<UordersPage />} />
        <Route path="/products" element={<GoodsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
