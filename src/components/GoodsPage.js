import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import GoodsRow from './GoodsRow';

const GoodsPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [scroll, setScroll] = useState(false);
    useEffect(() => {
        window.addEventListener("scroll", () => {
            setScroll(window.scrollY > 20);
        })
    }, [])

    //前端测试数据
    const initialProducts = [
        { id: 1, name: '美的空调', category: 'Electronic Applications', is_avaliable: true, selling_price: 5439.20, description: '3匹 风尊 新一级能效 变频冷暖 独立除湿 立式空调柜', image: 'https://img10.360buyimg.com/n1/s450x450_jfs/t1/197702/15/45785/108198/67079c22Fc269d324/9f3121e970f41906.jpg.avif' },
        { id: 2, name: '长虹空调', category: 'Electronic Applications', is_avaliable: true, selling_price: 1599.00, description: '大1匹新一级能效变频冷暖省电京小宅 智能卧室空调挂机', image: 'https://img14.360buyimg.com/n1/s450x450_jfs/t1/100487/19/49284/5272/66ed4049Fbb1c2a02/b749712e60e2559c.jpg.avif' },
        { id: 3, name: 'Product 3', category: 'Category A', is_avaliable: false },
        { id: 4, name: '长虹空调2', category: 'Female Clothing', is_avaliable: true, selling_price: 599.00, description: '大1匹新一级能效变频冷暖省电京小宅 智能卧室空调挂机', image: 'https://img14.360buyimg.com/n1/s450x450_jfs/t1/100487/19/49284/5272/66ed4049Fbb1c2a02/b749712e60e2559c.jpg.avif' },
        { id: 5, name: '长虹空调2', category: 'Female Clothing', is_avaliable: true, selling_price: 599.00, description: '大1匹新一级能效变频冷暖省电京小宅 智能卧室空调挂机', image: 'https://img14.360buyimg.com/n1/s450x450_jfs/t1/100487/19/49284/5272/66ed4049Fbb1c2a02/b749712e60e2559c.jpg.avif' },
        { id: 6, name: '长虹空调2', category: 'Female Clothing', is_avaliable: true, selling_price: 599.00, description: '大1匹新一级能效变频冷暖省电京小宅 智能卧室空调挂机', image: 'https://img14.360buyimg.com/n1/s450x450_jfs/t1/100487/19/49284/5272/66ed4049Fbb1c2a02/b749712e60e2559c.jpg.avif' },
        { id: 7, name: '长虹空调2', category: 'Female Clothing', is_avaliable: true, selling_price: 599.00, description: '大1匹新一级能效变频冷暖省电京小宅 智能卧室空调挂机', image: 'https://img14.360buyimg.com/n1/s450x450_jfs/t1/100487/19/49284/5272/66ed4049Fbb1c2a02/b749712e60e2559c.jpg.avif' },
        { id: 8, name: '长虹空调2', category: 'Female Clothing', is_avaliable: true, selling_price: 599.00, description: '大1匹新一级能效变频冷暖省电京小宅 智能卧室空调挂机', image: 'https://img14.360buyimg.com/n1/s450x450_jfs/t1/100487/19/49284/5272/66ed4049Fbb1c2a02/b749712e60e2559c.jpg.avif' },
        // ... 更多商品数据
    ];
    useEffect(() => {
        // 初始化商品列表和分类
        setProducts(initialProducts);
        const uniqueCategories = [...new Set(initialProducts.map(product => product.category))];
        uniqueCategories.unshift('All'); // 添加“全部”选项
        setCategories(uniqueCategories);

        // 初始筛选，显示所有可用商品
        const availableProducts = initialProducts.filter(product => product.is_avaliable === true);
        setFilteredProducts(availableProducts);
    }, []);

    //useEffect(() => {
    // 获取商品列表  
    //     axios.get('http://localhost:3000/api/products')
    //         .then(response => {
    //             setProducts(response.data);

    //             // 获取所有独特的分类  
    //             const uniqueCategories = [...new Set(response.data.map(product => product.category))];
    //             uniqueCategories.unshift('全部'); // 添加“全部”选项  
    //             setCategories(uniqueCategories);

    //             // 初始筛选，显示所有可用商品  
    //             const availableProducts = response.data.filter(product => product.is_avaliable === true);
    //             setFilteredProducts(availableProducts);
    //         })
    //         .catch(error => console.error('Error fetching products:', error));
    // }, []);

    useEffect(() => {
        // 根据选择的分类筛选商品  
        if (activeCategory === 'All') {
            setFilteredProducts(products.filter(product => product.is_avaliable === true));
        } else {
            setFilteredProducts(products.filter(product => product.category === activeCategory && product.is_avaliable === true));
        }
    }, [activeCategory, products]);

    return (
        <div>
            <div className={`header ${scroll ? 'scrolled' : ''}`}>
                <div className='header-container'>
                    <div className='header-title'>Products</div>
                    <div className="tab">
                        {categories.map(category => (
                            <button
                                key={category}
                                className={`tablinks ${activeCategory === category ? 'active' : ''}`}
                                onClick={() => setActiveCategory(category)}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                    <Link to="/">Back to Home</Link>
                </div>
            </div>
            <div className='home'>
                <div className="card-list">
                    {filteredProducts.map(product => (
                        <GoodsRow key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GoodsPage;