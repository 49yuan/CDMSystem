import React, { useState } from 'react';
import axios from 'axios';

const ProductRow = ({ product, onPurchase, onAvailabilityChange }) => {
    const [supplier, setSupplier] = useState('供应商1'); // 默认为供应商1  
    const [price, setPrice] = useState(product.purchase_price); // 默认为商品信息中的入库价格  
    const [product_id, setproduct_id] = useState(product.id);
    const [quantity, setQuantity] = useState(0); // 初始数量为0，用户需要填写  
    const [isEditingQuantity, setIsEditingQuantity] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleQuantityChange = (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 0) {
            setQuantity(value);
        }
    };

    const handleConfirmPurchase = async () => {
        if (quantity > 0) {
            try {
                const response = await axios.post('/api/orders', {
                    productId: product_id,
                    supplier: supplier,
                    price: price,
                    quantity: quantity,
                    purchase: 'purchase'
                });

                console.log('Order added successfully:', response.data);

                setQuantity(0);
                setIsEditingQuantity(false);

                // 可以添加额外的逻辑，比如显示成功消息等  

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
        <tr>
            <td>{product.id}</td>
            <td>{product.name}</td>
            <td>{product.category}</td>
            <td>{product.quantity}</td>
            <td>{product.selling_price}</td>
            <td>{product.purchase_price}</td>
            <td>{product.is_available === 1 ? 'Yes' : 'No'}</td>
            <td>
                <button onClick={() => onAvailabilityChange(!product.is_available)}>
                    {product.is_available === 1 ? 'Shelf' : 'Unshelf'}
                </button>
                <button onClick={() => { setIsEditingQuantity(true); setIsModalOpen(true); }}>Purchase</button>
                {isModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <input
                                type="text"
                                value={quantity}
                                onChange={handleQuantityChange}
                                placeholder="Quantity"
                                style={{ marginLeft: '10px' }}
                            />
                            <div>
                                <button onClick={() => setQuantity(Math.max(quantity - 1, 0))}>-</button>
                                <span>{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)}>+</button>
                            </div>
                            <div style={{ marginTop: '10px' }}>Total Price: {totalPrice.toFixed(2)}</div>
                            <button onClick={() => { setIsEditingQuantity(false); setIsModalOpen(false); }} style={{ marginTop: '10px' }}>Cancel</button>
                            <button onClick={handleConfirmPurchase} style={{ marginLeft: '10px' }}>
                                Confirm Order
                            </button>
                        </div>
                    </div>
                )}
            </td>
        </tr>
    );
};

export default ProductRow;