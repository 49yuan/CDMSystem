import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import GoodRow from './GoodRow';

const GoodsPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        // 获取商品列表  
        axios.get('localhost:3000/api/products')
            .then(response => {
                setProducts(response.data);

                // 获取所有独特的分类  
                const uniqueCategories = [...new Set(response.data.map(product => product.category))];
                uniqueCategories.unshift('全部'); // 添加“全部”选项  
                setCategories(uniqueCategories);

                // 初始筛选，显示所有可用商品  
                const availableProducts = response.data.filter(product => product.is_avaliable === true);
                setFilteredProducts(availableProducts);
            })
            .catch(error => console.error('Error fetching products:', error));
    }, []);

    useEffect(() => {
        // 根据选择的分类筛选商品  
        if (selectedCategory === '全部') {
            setFilteredProducts(products.filter(product => product.is_avaliable === true));
        } else {
            setFilteredProducts(products.filter(product => product.category === selectedCategory && product.is_avaliable === true));
        }
    }, [selectedCategory, products]);

    return (
        <div>
            <h1>Products</h1>
            <Link to="/">Back to Home</Link>
            <div>
                <label>
                    Filter by Category:
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                        {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </label>
            </div>
            <div>
                {filteredProducts.map(product => (
                    <GoodRow
                        key={product.id}
                        product={product}
                    />
                ))}
            </div>
        </div>
    );
};

export default GoodsPage;