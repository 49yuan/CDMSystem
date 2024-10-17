import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import OrdersRow from './OrdersRow';

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [scroll, setScroll] = useState(false);
    useEffect(() => {
        window.addEventListener("scroll", () => {
            setScroll(window.scrollY > 20);
        })
    }, [])

    //前端测试数据（合并并处理后的数据）注意：name,description,src等都是通过关联product_id获得的
    //管理员用户查看订单需要每种货物多少，处理发货--->
    //点击确认发货，与仓库该product_id的存货做对比，如果足够显示发货成功，仓库相应扣除，
    //如果库存小于订单所需商品数量，提醒补货（该商品正在进行的出库订单 - 正在进行的采购订单 + 库存 - 安全库存）alter
    //采购订单处理：点击变更状态,后台相应变化，订单结束，仓库变换
    //用户：物流订单
    const initialOrders = [
        { order_id: 1, order_type: 'selling', status: 'ongoing', date: '2024-10-10', initiator_or_supplier: '用户1', product_id: '1', quantity: '2', name: '美的空调', image: 'https://img10.360buyimg.com/n1/s450x450_jfs/t1/197702/15/45785/108198/67079c22Fc269d324/9f3121e970f41906.jpg.avif', phone: '123456', destination: '厦门大学二号鸟箱' },
        { order_id: 2, order_type: 'selling', status: 'ongoing', date: '2024-10-10', initiator_or_supplier: '用户1', product_id: '2', quantity: '1', name: '长虹空调', image: 'https://img14.360buyimg.com/n1/s450x450_jfs/t1/100487/19/49284/5272/66ed4049Fbb1c2a02/b749712e60e2559c.jpg.avif', phone: '123456', destination: '厦门大学二号鸟箱' },
        { order_id: 3, order_type: 'purchase', status: 'ongoing', date: '2024-10-10', initiator_or_supplier: '供应商1', product_id: '4', quantity: '5', name: '长虹空调2', image: 'https://img14.360buyimg.com/n1/s450x450_jfs/t1/100487/19/49284/5272/66ed4049Fbb1c2a02/b749712e60e2559c.jpg.avif', phone: '654321' },
        { order_id: 1, order_type: 'selling', status: 'ongoing', date: '2024-10-10', initiator_or_supplier: '用户1', product_id: '1', quantity: '2', name: '美的空调', image: 'https://img10.360buyimg.com/n1/s450x450_jfs/t1/197702/15/45785/108198/67079c22Fc269d324/9f3121e970f41906.jpg.avif', phone: '123456', destination: '厦门大学二号鸟箱' },
        { order_id: 2, order_type: 'selling', status: 'completed', date: '2024-10-10', initiator_or_supplier: '用户1', product_id: '2', quantity: '1', name: '长虹空调', image: 'https://img14.360buyimg.com/n1/s450x450_jfs/t1/100487/19/49284/5272/66ed4049Fbb1c2a02/b749712e60e2559c.jpg.avif', phone: '123456', destination: '厦门大学二号鸟箱' },
    ];
    useEffect(() => {
        setOrders(initialOrders);
    }, []);
    const handleStatusChange = (order) => {
        const updatedOrders = orders.map(o => {
            if (o.order_id === order.order_id) {
                return { ...o, status: 'completed' };
            }
            return o;
        });
        setOrders(updatedOrders);
    };
    const handleShipment = (order) => {
        if (order.status === 'ongoing') {
            axios.get('http://localhost:3001/api/checkInventory')
                .then(response => {
                    if (response.data.error) {
                        alert(`缺货，请补充${response.data.needToStock}件`);
                    } else {
                        alert('发货成功');
                    }
                })
                .catch(error => {
                    console.error('请求失败:', error);
                    alert('发货失败，请稍后再试');
                });
        }
    };
    const handleCancel = (order) => {
        const updatedOrders = orders.map(o => {
            if (o.order_id === order.order_id) {
                return { ...o, status: 'failed' };
            }
            return o;
        });
        setOrders(updatedOrders);
    };
    // <button onClick={() => onStatusChange(!order.order_type)} >
    //     {order.order_type === 1 ? 'ongoing' : 'completed'}
    // </button>


    // 初始化默认选项卡
    const [activeTab, setActiveTab] = useState('selling');
    return (
        <div>
            <div className={`header ${scroll ? 'scrolled' : ''}`}>
                <div className='header-container'>
                    <div className='header-title'>Orders</div>
                    <div className="tab">
                        <button className={`tablinks ${activeTab === 'selling' ? 'active' : ''}`} onClick={() => setActiveTab('selling')} id="defaultOpen">Selling</button>
                        <button className={`tablinks ${activeTab === 'purchase' ? 'active' : ''}`} onClick={() => setActiveTab('purchase')} >Purchase</button>
                        {/* <button class="tablinks" onclick="openCity(event, 'Tokyo')">Tokyo</button> */}
                    </div>
                    <Link to="/">Back to Home</Link>
                </div>
            </div>
            <div className='home'>
                <div id="selling" className={`tabcontent ${activeTab === 'selling' ? 'active' : ''}`}>
                    <h3>Selling</h3>
                    <div className='selling_order'>
                        {orders.filter(order => order.order_type === 'selling').map(order => (
                            <div key={order.order_id} className='order'>
                                <div className='order_id'>Order {order.order_id}
                                    <span className={`status ${order.status === 'ongoing' ? 'status-ongoing' : (order.status === 'completed' ? 'status-completed' : (order.status === 'failed' ? 'status-failed' : ''))}`}>{order.status}</span>
                                </div>
                                <img src={order.image} alt={order.name} />
                                <div className='order_details'>
                                    <div className='order_name'>{order.name}<span>Quantity: {order.quantity}</span></div>
                                    <span>Initator: {order.initiator_or_supplier}</span>
                                    <span>Phone: {order.phone}</span>
                                    <div>Address: {order.destination}</div>
                                    <div>Order time: {order.date}</div>
                                </div>
                                <div className='order_action'>
                                    <button onClick={() => handleCancel(order)}>Cancel order</button>
                                    <button onClick={() => handleShipment(order)}>Confirm order</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div id="purchase" className={`tabcontent ${activeTab === 'purchase' ? 'active' : ''}`}>
                    <h3>Outbound</h3>
                    {orders.filter(order => order.order_type === 'purchase').map(order => (
                        <div key={order.order_id} className='order'>
                            <div className='order_id'>Order {order.order_id}
                                <span className={`status ${order.status === 'ongoing' ? 'status-ongoing' : (order.status === 'completed' ? 'status-completed' : (order.status === 'failed' ? 'status-failed' : ''))}`}>{order.status}</span>
                            </div>
                            <img src={order.image} alt={order.name} />
                            <div className='order_details'>
                                <div className='order_name'>{order.name}<span>Quantity: {order.quantity}</span></div>
                                <span>Supplier: {order.initiator_or_supplier}</span>
                                <div>Phone: {order.phone}</div>
                                <div>Order time: {order.date}</div>
                            </div>
                            <div className='order_action'>
                                <button onClick={() => handleStatusChange(order)}>Warehousing</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
};

export default OrdersPage;