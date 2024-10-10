import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* 其他路由 */}
      </Routes>
    </Router>
  );
}

export default App;
