const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());

app.use(bodyParser.json());

// 配置MySQL连接  
const db = mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'test0409',
    database: 'my_database'
});

// 连接到数据库  
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySQL connected...');
});

// 获取商品信息  
app.get('/api/products', (req, res) => {
    const sql = 'SELECT * FROM products';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

const getNextOrderId = (callback) => {
    const sql = 'SELECT COALESCE(MAX(order_id), 0) AS max_order_id FROM orders';
    db.query(sql, (err, results) => {
        if (err) {
            callback(err, null);
        } else {
            let maxOrderId = parseInt(results[0].max_order_id, 10);
            let nextOrderId = maxOrderId + 1;
            callback(null, nextOrderId);
        }
    });
};

const addOrder = (productId, supplier, price, quantity, purchase) => {
    return new Promise((resolve, reject) => {
        getNextOrderId((err, orderId) => {
            if (err) {
                reject(err);
                return;
            }

            const date = new Date().toISOString().split('T')[0];
            const query = 'INSERT INTO Orders (order_id, order_type, status, date, initiator_or_supplier, product_id, quantity, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            const values = [orderId, purchase, 'ongoing', date, supplier, productId, quantity, price];

            db.query(query, values, (error, results, fields) => {
                if (error) {
                    console.error('Error adding order:', error);
                    reject(error);
                } else {
                    console.log('Order added:', results.insertId);
                    resolve(results.insertId);
                }
            });
        });
    });
};

// 添加采购订单提交的API端点  
app.post('/api/orders', async (req, res) => {
    try {
        const { productId, supplier, price, quantity } = req.body;
        const orderId = await addOrder(productId, supplier, price, quantity);
        res.status(201).send({ orderId, message: 'Order added successfully.' });
    } catch (err) {
        console.error('Error handling order request:', err);
        res.status(500).send({ message: 'Error adding order: ' + err.message });
    }
});



// 根据ID获取单个商品信息
// app.get('/api/products/:id', (req, res) => {
//     const id = req.params.id;
//     const sql = `SELECT id, name, category, quantity, selling_price, purchase_price, is_available FROM products WHERE id = ?`;
//     db.query(sql, [id], (err, results) => {
//         if (err) throw err;
//         if (results.length > 0) {
//             res.json(results[0]);
//         } else {
//             res.status(404).send('Product not found');
//         }
//     });
// });

//更新商品的is_available状态
app.put('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const isAvailable = req.body.is_available;

    const sql = `UPDATE products SET is_available = ? WHERE id = ?`;
    db.query(sql, [isAvailable, id], (err, results) => {
        if (err) throw err;
        if (results.affectedRows > 0) {
            res.status(200).send('Product updated successfully');
        } else {
            res.status(404).send('Product not found');
        }
    });
});

//添加新商品
app.post('/api/products', (req, res) => {
    const name = req.body.name;
    const category = req.body.category;
    const quantity = req.body.quantity;
    const sellingPrice = req.body.selling_price;
    const purchasePrice = req.body.purchase_price;
    const description = req.body.description;
    const image = req.body.image;
    const isAvailable = req.body.is_available;

    const sql = `INSERT INTO products (name, category, quantity, selling_price, purchase_price, description, image, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(sql, [name, category, quantity, sellingPrice, purchasePrice, description, image, isAvailable], (err, results) => {
        if (err) throw err;
        res.status(201).send('Product added successfully');
    });
});

// 删除商品
// app.delete('/api/products/:id', (req, res) => {
//     const id = req.params.id;
//     const sql = `DELETE FROM products WHERE id = ?`;
//     db.query(sql, [id], (err, results) => {
//         if (err) throw err;
//         if (results.affectedRows > 0) {
//             res.status(200).send('Product deleted successfully');
//         } else {
//             res.status(404).send('Product not found');
//         }
//     });
// });

// 启动服务器  
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});