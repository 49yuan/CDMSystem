import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import GoodsRow from './GoodsRow';

const GoodsPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [scroll, setScroll] = useState(false);
    useEffect(() => {
        window.addEventListener("scroll", () => {
            setScroll(window.scrollY > 20);
        })
    }, [])

    useEffect(() => {
        axios.get('http://localhost:3001/api/products')
            .then(response => {
                setProducts(response.data);
                const uniqueCategories = [...new Set(response.data.map(product => product.category))];
                uniqueCategories.unshift('ALL');
                setCategories(uniqueCategories);

                const availableProducts = response.data.filter(product => product.is_available === 1);
                setFilteredProducts(availableProducts);
            })
            .catch(error => console.error('Error fetching products:', error));
    }, []);

    useEffect(() => {
        if (activeCategory === 'ALL') {
            setFilteredProducts(products.filter(product => product.is_available === 1));
        } else {
            setFilteredProducts(products.filter(product => product.category === activeCategory && product.is_available === 1));
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