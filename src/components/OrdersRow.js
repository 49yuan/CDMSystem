import React from 'react';
//还没改
const GoodsRow = ({ product }) => {

    const addToCartHandler = () => {
        // 添加采购订单
    };
    return (
        <div className="card">
            <img src={product.image} alt={product.name} />
            <div className="card-content">
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="price">${product.selling_price}</div>
                <div className="actions">
                    <button onClick={addToCartHandler}>Add to Cart</button>
                </div>
            </div>
        </div>
    );
};

export default GoodsRow;