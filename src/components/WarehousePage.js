import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ProductRow from './ProductRow'

const WarehousePage = () => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        // 获取商品列表  
        axios.get('http://localhost:3000/api/products')
            .then(response => {
                setProducts(response.data);
            })
            .catch(error => console.error('Error fetching products:', error));
    }, []);

    const handlePurchase = async (productId, supplier, price, quantity) => {
        try {
            // 发送采购请求到后端  
            const response = await axios.post(`http://localhost:3000/api/purchases`, {
                product_id: productId,
                supplier: supplier,
                price: price,
                quantity: quantity,
            });
            alert('Purchase order created successfully!');
            // 重新加载商品列表（如果需要的话）  
            // setProducts(await fetchProducts());
        } catch (error) {
            console.error('Error creating purchase order:', error);
        }
    };

    const handleAvailabilityChange = async (productId, isAvailable) => {
        try {
            // 更新商品的is_available状态  
            const response = await axios.put(`http://localhost:3000/api/products/${productId}`, { is_available: isAvailable });
            // 重新加载商品列表  
            setProducts(await axios.get('http://localhost:3000/api/products').then(response => response.data));
        } catch (error) {
            console.error('Error updating product availability:', error);
        }
    };

    return (
        <div>
            <h1>Warehouse</h1>
            <Link to="/">Back to Home</Link>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Quantity</th>
                        <th>Selling Price</th>
                        <th>Purchase Price</th>
                        <th>Availability</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <ProductRow
                            key={product.id}
                            product={product}
                            onPurchase={(supplier, price, quantity) => handlePurchase(product.id, supplier, price, quantity)}
                            onAvailabilityChange={isAvailable => handleAvailabilityChange(product.id, isAvailable)}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default WarehousePage;