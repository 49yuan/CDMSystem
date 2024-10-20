import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
// 物流订单

const UordersPage = () => {
    const [orders, setOrders] = useState([]);
    const [productNames, setProductNames] = useState([]);
    const [orderNums, setOrderNums] = useState([]);
    const [scroll, setScroll] = useState(false);
    useEffect(() => {
        window.addEventListener("scroll", () => {
            setScroll(window.scrollY > 20);
        })
    }, [])

    //用户：物流订单
    // const initialUorders = [
    //     { id: 1, order_id: 1, product_id: 1, product_name: '美的空调', quantity: '2', status: 'ongoing', date: '2024-10-10', initator: '用户1', initator_phone: '123456', destination: '厦门大学二号鸟箱', order_num: 'Y1234567899189', pickcode: '76-5-7080' },
    //     { id: 2, order_id: 1, product_id: 1, product_name: '美的空调', quantity: '1', status: 'ongoing', date: '2024-10-10', initator: '用户1', initator_phone: '123456', destination: '厦门大学二号鸟箱', order_num: 'Y1234567899189', pickcode: '76-5-7080' },
    //     { id: 3, order_id: 2, product_id: 2, product_name: '优品女装', quantity: '4', status: 'ongoing', date: '2024-10-10', initator: '用户1', initator_phone: '123456', destination: '厦门大学二号鸟箱', order_num: 'Y1234567899189', pickcode: '76-5-7080' },
    // ];
    useEffect(() => {
        async function fetchOrders() {
            try {
                const response = await axios.get('http://localhost:3001/api/logistics');
                setOrders(response.data);

                const productNamesPromises = response.data.map(order =>
                    axios.get(`http://localhost:3001/api/getproductname?productId=${order.product_id}`)
                );

                const productNamesResults = await Promise.all(productNamesPromises);
                const productNames = productNamesResults.map(productResponse => productResponse.data.name);
                setProductNames(productNames);

                const newOrderNums = response.data.map(() => {
                    return uuidv4().replace(/-/g, '').slice(0, 19);
                });
                setOrderNums(newOrderNums);
            } catch (error) {
                console.error('Error fetching orders:', error);
            }
        }

        fetchOrders();
    }, []);
    const handleShipment = (order) => {
        const response = axios.put(`http://localhost:3001/api/logistics/${order.id}`, { status: 'completed' });
        const updatedOrders = orders.map(o => {
            if (o.id === order.id) {
                return { ...o, status: 'completed' };
            }
            return o;
        });
        setOrders(updatedOrders);
    };

    return (
        <div>
            <div className={`header ${scroll ? 'scrolled' : ''}`}>
                <div className='header-container'>
                    <div className='header-title'>Logistics</div>
                    <Link to="/">Back to Home</Link>
                </div>
            </div>
            <div className='home'>
                <div className='selling_order'>
                    {orders.map((order, index) => (
                        <div className='logistics'>
                            <div key={order.id} className='order'>
                                <div className='order_id'>圆通快递{orderNums[index]}
                                    <span className={`status ${order.status === 'ongoing' ? 'status-ongoing' : (order.status === 'completed' ? 'status-completed' : (order.status === 'failed' ? 'status-failed' : ''))}`}>{order.status}</span>
                                </div>
                                <div className='order_details'>
                                    <div className='order_name'>收货地址：{order.destination}</div>
                                    <span className='pdn'>{productNames[index]}</span>
                                    <span>×{order.quantity}</span>
                                    <div className='order_status'>
                                        <div>已到达</div>
                                        <span>您购买的商品已到达，请凭取件码{order.pickcode}取件</span>
                                        <div>运输中</div>
                                        <div>仓库处理中</div>
                                        <span>您的订单由第三方卖家拣货完成，待出库交付圆通快递，运单号为{orderNums[index]}</span>
                                        <div>已下单</div>
                                        <span>您提交了订单，请等待第三方卖家系统确认</span>
                                    </div>
                                    <div>{order.time}</div>
                                </div>
                                <div className='order_action'>
                                    <button onClick={() => handleShipment(order)}>Confirm shipment</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UordersPage;