import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ProductRow from './ProductRow'

const WarehousePage = () => {
    const [products, setProducts] = useState([]);
    const [scroll, setScroll] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', category: '', quantity: 0, selling_price: 0, purchase_price: 0, description: '', image: '', is_available: true });
    const [addingProduct, setAddingProduct] = useState(false); // 跟踪是否正在添加商品，以防止重复提交
    useEffect(() => {
        window.addEventListener("scroll", () => {
            setScroll(window.scrollY > 20);
        })
    }, [])

    useEffect(() => {
        // 获取商品列表  
        axios.get('http://localhost:3001/api/products')
            .then(response => {
                setProducts(response.data);
            })
            .catch(error => console.error('Error fetching products:', error));
    }, []);

    const handleAddProduct = async () => {
        setAddingProduct(true); // 防止重复提交  

        try {
            const response = await axios.post('http://localhost:3001/api/products', newProduct);
            alert('Product added successfully!');
            setProducts([...products, response.data]); // 假设后端返回了新添加的商品数据，这里简单地将它添加到现有列表中  
            setNewProduct({ name: '', category: '', quantity: 0, safety_stock: 0, max_d_quantity: 0, selling_price: 0, purchase_rrice: 0, description: '', image: '', is_available: true }); // 重置表单  
            setAddingProduct(false); // 允许再次提交  
            setProducts(await axios.get('http://localhost:3001/api/products').then(response => response.data));
        } catch (error) {
            console.error('Error adding product:', error);
            setAddingProduct(false); // 允许再次提交，即使发生了错误  
        }
    };

    const handlePurchase = async (productId, supplier, price, quantity, destination) => {
        try {
            // 发送采购请求到后端  
            const response = await axios.post(`http://localhost:3001/api/purchases`, {
                product_id: productId,
                supplier: supplier,
                price: price,
                quantity: quantity,
                purchase: ' purchase',
                destination: destination
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
            const response = await axios.put(`http://localhost:3001/api/products/${productId}`, { is_available: isAvailable });
            // 重新加载商品列表  
            setProducts(await axios.get('http://localhost:3001/api/products').then(response => response.data));
        } catch (error) {
            console.error('Error updating product availability:', error);
        }
    };

    return (
        <div>
            <div className={`header ${scroll ? 'scrolled' : ''}`}>
                <div className='header-container'>
                    <div className='header-title'>Products</div>
                    <Link to="/">Back to Home</Link>
                </div>
            </div>
            <div className='home'>
                <div className="add-product-form">
                    <h2>Add New Product</h2>
                    <form onSubmit={e => { e.preventDefault(); handleAddProduct(); }}>
                        <input
                            type="text"
                            placeholder="Name"
                            value={newProduct.name}
                            onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Category"
                            value={newProduct.category}
                            onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                            required
                        />
                        <input
                            type="number"
                            placeholder="Quantity"
                            value={newProduct.quantity}
                            onChange={e => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value, 10) || 0 })}
                            required
                        />
                        <input
                            type="number"
                            placeholder="Safety Stock"
                            value={newProduct.safety_stock}
                            onChange={e => setNewProduct({ ...newProduct, safety_stock: parseFloat(e.target.value) || 0 })}
                            required
                        />
                        <input
                            type="number"
                            placeholder="Max DQuantity"
                            value={newProduct.max_d_quantity}
                            onChange={e => setNewProduct({ ...newProduct, max_d_quantity: parseFloat(e.target.value) || 0 })}
                            required
                        />
                        <input
                            type="number"
                            placeholder="Selling Price"
                            value={newProduct.selling_price}
                            onChange={e => setNewProduct({ ...newProduct, selling_price: parseFloat(e.target.value) || 0 })}
                            required
                        />
                        <input
                            type="number"
                            placeholder="Purchase Price"
                            value={newProduct.purchase_price}
                            onChange={e => setNewProduct({ ...newProduct, purchase_price: parseFloat(e.target.value) || 0 })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Description"
                            value={newProduct.description}
                            onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Image"
                            value={newProduct.image}
                            onChange={e => setNewProduct({ ...newProduct, image: e.target.value })}
                            required
                        />
                        <label>
                            <input
                                type="checkbox"
                                checked={newProduct.is_available}
                                onChange={e => setNewProduct({ ...newProduct, is_available: e.target.checked })}
                            />
                            Available
                        </label>
                        <button type="submit" disabled={addingProduct}>Add Product</button>
                    </form>
                </div>
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
                                onPurchase={(supplier, price, quantity, destination) => handlePurchase(product.id, supplier, price, quantity, destination)}
                                onAvailabilityChange={isAvailable => handleAvailabilityChange(product.id, isAvailable)}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default WarehousePage;