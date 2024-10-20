import React, { useState, useEffect } from 'react';
import axios from 'axios';


const GoodsRow = ({ product }) => {

    const [supplier, setSupplier] = useState('用户1'); // 默认为用户1 
    const [price, setPrice] = useState(product.selling_price);
    const [product_id, setproduct_id] = useState(product.id);
    const [quantity, setQuantity] = useState(0); // 初始数量为0，用户需要填写  
    const [isEditingQuantity, setIsEditingQuantity] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [destination, setDestination] = useState('厦门大学翔安校区二期鸟箱');
    const [phone, setPhone] = useState('654321');

    const [user, setUser] = useState({ name: 'user', isLoggedIn: false, userType: '' });
    useEffect(() => {
        // 检查用户 
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('userType');
        if (token && userType) {
            setUser({ ...user, name: 'user', isLoggedIn: true, userType: userType });
            if (userType === 'administrator') {
                setUser({ ...user, name: 'admin' })
            }
        }
    }, []);

    const handleQuantityChange = (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 0) {
            setQuantity(value);
        }
    };

    const handleConfirmPurchase = async () => {
        if (quantity > 0) {
            try {
                const response = await axios.post('http://localhost:3001/api/purchases', {
                    productId: product_id,
                    supplier: supplier,
                    price: price,
                    quantity: quantity,
                    purchase: 'selling',
                    destination: destination,
                    phone: phone
                });

                console.log('Order added successfully:', response.data);
                alert('Order added successfully!');
                setQuantity(0);
                setIsEditingQuantity(false);

            } catch (error) {
                console.error('Error adding order:', error.response ? error.response.data : error.message);
                alert('Failed to add order. Please try again later.');
            }
        } else {
            alert('Please enter a valid quantity!');
        }
    };

    const totalPrice = price * quantity;

    return (
        <div className="card">
            <img src={product.image} alt={product.name} />
            <div className="card-content">
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="price">${product.selling_price}</div>
                <div className="actions">
                    <button onClick={() => { if (user.userType === 'user') { setIsEditingQuantity(true); setIsModalOpen(true); } }}>Add to Cart</button>
                    {isModalOpen && (
                        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ height: '250px' }}>
                                <h3>正在下单{product.name}</h3>
                                <input
                                    type="text"
                                    value={quantity}
                                    onChange={handleQuantityChange}
                                    placeholder="Quantity"
                                />
                                <input type="text"
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                    placeholder="Destination"></input>
                                <input type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Phone"></input>
                                <div style={{ marginTop: '10px' }}>Total Price: {totalPrice.toFixed(2)}</div>
                                <button onClick={() => { setIsEditingQuantity(false); setIsModalOpen(false); }} style={{ marginTop: '10px' }}>Cancel</button>
                                <button onClick={handleConfirmPurchase} style={{ marginLeft: '10px' }}>
                                    Confirm Order
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GoodsRow;