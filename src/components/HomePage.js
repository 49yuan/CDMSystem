import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
// import axios from 'axios';

const HomePage = () => {
    const [user, setUser] = useState({ name: 'user', isLoggedIn: false, userType: '' });
    const navigate = useNavigate();

    useEffect(() => {
        // 检查是否已登录（这里简单模拟，实际情况应从后端API或localStorage等获取）  
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('userType');
        if (token && userType) {
            setUser({ ...user, name: 'user', isLoggedIn: true, userType: userType });
            if (userType === 'administrator') {
                setUser({ ...user, name: 'admin', isLoggedIn: true, userType: userType })
            }
        } else {
            // 如果没有token，则重定向到登录页面  
            navigate('/login');
        }
    }, []);

    const handleLogout = () => {
        // 处理登出逻辑（清除token，重定向到登录页等）  
        localStorage.removeItem('token');
        setUser({ name: 'user', isLoggedIn: false, userType: '' });
        navigate('/login');
    };

    return (
        <div>
            <div className='header'>
                <div className='header-container'>
                    <div className='header-title'>CDM System</div>
                </div>
            </div>
            <div className='home'>
                <div className='homepage'>
                    <h1>Welcome, {user.name}!</h1>
                    {user.isLoggedIn && (
                        <div>
                            <button onClick={handleLogout}>Log out</button>
                            <div className='homelink'>
                                {user.userType === 'administrator' && (
                                    <div className='homelist'>
                                        <Link to="/warehouse">Go to Warehouse</Link>
                                        <Link to="/orders">Go to Order Management</Link>
                                        <Link to="/products">Go to Product Page</Link>
                                    </div>
                                )}
                                {user.userType === 'user' && (
                                    <div className='homelist'>
                                        <Link to="/uorders">Go to Order Management</Link>
                                        <Link to="/products">Go to Product Page</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {!user.isLoggedIn && (
                        <div>
                            <button ><a href='/login'>Log on</a></button>
                            <div className='homelink'>
                                <div className='homelist'>
                                    <div><Link to="/products">Go to Product Page</Link></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;