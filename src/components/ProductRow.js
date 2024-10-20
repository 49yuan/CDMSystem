import React, { useState } from 'react';
import axios from 'axios';

const ProductRow = ({ product, onPurchase, onAvailabilityChange }) => {
    const [supplier, setSupplier] = useState('Supplier Name');
    const [price, setPrice] = useState(product.purchase_price); // 默认为商品信息中的入库价格  
    const [product_id, setproduct_id] = useState(product.id);
    const [quantity, setQuantity] = useState(0); // 初始数量为0，用户需要填写  
    const [isEditingQuantity, setIsEditingQuantity] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [destination, setDestination] = useState('CDM仓库1');

    const closeModal = () => {
        setIsEditingQuantity(false);
        setIsModalOpen(false);
        setQuantity(0); // 可选：关闭模态框时重置数量  
    };
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
                    purchase: 'purchase',
                    destination: destination,
                    phone: '123456'
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
        <tr className={product.quantity < product.safety_stock ? 'low-stock' : ''}>
            <td>{product.id}</td>
            <td>{product.name}</td>
            <td>{product.category}</td>
            <td>{product.quantity}/{product.safety_stock}</td>
            <td>{product.selling_price}</td>
            <td>{product.purchase_price}</td>
            <td>{product.is_available === 1 ? 'Yes' : 'No'}</td>
            <td className='actions1'>
                <button onClick={() => onAvailabilityChange(!product.is_available)} style={{ width: '70px' }} >
                    {product.is_available === 1 ? 'Shelf' : 'Unshelf'}
                </button>
                <button onClick={() => { setIsEditingQuantity(true); setIsModalOpen(true); }}>Purchase</button>
                {isModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>正在采购{product.name}</h3>
                            <input
                                type="text"
                                value={quantity}
                                onChange={handleQuantityChange}
                                placeholder="Quantity"
                            />
                            <input type="text"
                                value={destination}
                                placeholder="Destination"></input>
                            <div style={{ marginTop: '10px' }}>Total Price: {totalPrice.toFixed(2)}</div>
                            <button onClick={closeModal} style={{ marginTop: '10px' }}>Cancel</button>
                            <button onClick={handleConfirmPurchase} style={{ marginLeft: '10px' }}>
                                Confirm Order
                            </button>
                        </div>
                    </div>
                )}
            </td>
        </tr >
    );
};

export default ProductRow;