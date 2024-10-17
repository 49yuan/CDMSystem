import React from 'react';
import LoginForm from '../components/LoginForm';

const LoginPage = () => {
    return (
        <div>
            <div className='login'>
                <div className='main-overlay'>
                    <div className='main-con'>
                        <div className='login-container'>
                            <h1>欢迎登录</h1>
                            <LoginForm />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;