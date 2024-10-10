import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import axios from 'axios';

const HomePage = () => {
    const [user, setUser] = useState({ name: 'user', isLoggedIn: false });
    const [ordersCount, setOrdersCount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        // 检查是否已登录（这里简单模拟，实际情况应从后端API或localStorage等获取）  
        const token = localStorage.getItem('token');
        if (token) {
            setUser({ ...user, name: '管理员', isLoggedIn: true });
            // 假设登录后获取订单数量（需要后端支持）  
            // axios.get('/api/orders/count')
            //     .then(response => setOrdersCount(response.data.count))
            //     .catch(error => console.error('获取订单数量失败:', error));
        }
    }, []);

    const handleLogout = () => {
        // 处理登出逻辑（清除token，重定向到登录页等）  
        localStorage.removeItem('token');
        setUser({ name: 'user', isLoggedIn: false });
        navigate('/login');
    };

    return (
        <div>
            <h1>欢迎, {user.name}!</h1>
            {user.isLoggedIn && (
                <div>
                    <button onClick={handleLogout}>登出</button>
                    <div>
                        <Link to="/warehouse">前往仓库页面</Link>
                        <Link to="/orders">订单管理页面 <span>{ordersCount > 0 && <span style={{ color: 'red', marginLeft: '5px' }}>{ordersCount}</span>}</span></Link>
                        <Link to="/products">商品页面</Link>
                    </div>
                </div>
            )}
            {!user.isLoggedIn && (
                <div>
                    <Link to="/login">登录</Link>
                    <Link to="/products">商品页面</Link>
                </div>
            )}
            {/* 其他信息，如通知、公告等 */}
            <div>
                <h2>公告</h2>
                <p>欢迎使用超级用户板块！</p>
            </div>
        </div>
    );
};

export default HomePage;