const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = 3001;

app.use(cors());

app.use(bodyParser.json());

// 配置MySQL连接  
const connection = mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'test0409',
    database: 'my_database'
});

// 连接到数据库  
connection.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySQL connected...');
});
// 以下是一些帮助函数，用于与数据库交互
const util = require('util');

// 将回调函数的数据库查询转为 Promise
connection.query = util.promisify(connection.query);
// 获取商品信息  
app.get('/api/products', (req, res) => {
    const sql = 'SELECT * FROM products';
    connection.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

const addOrder = (productId, supplier, price, quantity, purchase, destination, phone) => {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO Orders (order_type, status, initiator_or_supplier, product_id, quantity, price, destination, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [purchase, 'ongoing', supplier, productId, quantity, price, destination, phone];
        connection.query(query, values, (error, results, fields) => {
            if (error) {
                console.error('Error adding order:', error);
                reject(error);
            } else {
                console.log('Order added:', results.insertId);
                resolve(results.insertId);
            }
        });
    });
    // });
};

// 添加采购订单提交的API端点  
app.post('/api/purchases', async (req, res) => {
    try {
        const { productId, supplier, price, quantity, purchase, destination, phone } = req.body;
        const orderId = await addOrder(productId, supplier, price, quantity, purchase, destination, phone);
        res.status(201).send({ orderId, message: 'Order added successfully.' });
    } catch (err) {
        console.error('Error handling order request:', err);
        res.status(500).send({ message: 'Error adding order: ' + err.message });
    }
});
//更新商品的is_available状态
app.put('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const isAvailable = req.body.is_available;

    const sql = `UPDATE products SET is_available = ? WHERE id = ?`;
    connection.query(sql, [isAvailable, id], (err, results) => {
        if (err) throw err;
        if (results.affectedRows > 0) {
            res.status(200).send('Product updated successfully');
        } else {
            res.status(404).send('Product not found');
        }
    });
});
//更新物流状态
app.put('/api/logistics/:id', (req, res) => {
    const id = req.params.id;
    const status = req.body.status;

    const sql = `UPDATE logistics SET status = ? WHERE id = ?`;
    connection.query(sql, [status, id], (err, results) => {
        if (err) throw err;
        if (results.affectedRows > 0) {
            res.status(200).send('Confirm receipt');
        } else {
            res.status(404).send('Fail to confirm receipt');
        }
    });
});
//更新订单状态
app.put('/api/changeos/:order_id', (req, res) => {
    const id = req.params.order_id;
    const status = req.body.status;

    const sql = `UPDATE orders SET status = ? WHERE order_id = ?`;
    connection.query(sql, [status, id], (err, results) => {
        if (err) throw err;
        if (results.affectedRows > 0) {
            res.status(200).send('Failed receipt success');
        } else {
            res.status(404).send('Fail to failde receipt');
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
    connection.query(sql, [name, category, quantity, sellingPrice, purchasePrice, description, image, isAvailable], (err, results) => {
        if (err) throw err;
        res.status(201).send('Product added successfully');
    });
});

async function completeInboundOrder(order_id) {
    try {
        const results = await connection.query('SELECT * FROM orders WHERE order_id = ?', [order_id]);
        if (results.length === 0) {
            throw new Error('订单不存在');
        }
        const affectedRows = await connection.query('UPDATE products SET quantity = quantity + ? WHERE id = ?', [results[0].quantity, results[0].product_id]);
        if (affectedRows.affectedRows === 0) {
            throw new Error('库存更新失败');
        }
        const updateOrderResults = await connection.query('UPDATE orders SET status = ? WHERE order_id = ?', ['completed', order_id]);
        if (updateOrderResults.affectedRows === 0) {
            throw new Error('订单状态更新失败');
        }
        return { success: true };
    } catch (error) {
        console.error('Error in completeInboundOrder:', error);
        return { error: error.message };
    }
}
//入库确认
app.post('/api/completedorder', async (req, res) => {
    console.log('Entering /api/completedorder route'); // 调试语句
    const { order_id } = req.body;
    console.log(order_id);
    if (!order_id) {
        return res.status(400).json({ error: '缺少 order_id' });
    }
    const result = await completeInboundOrder(order_id); // 调用上面定义的异步函数
    console.log('Result from completeInboundOrder:', result); // 调试语句
    if (result.error) {
        res.status(400).json({ error: result.error });
    } else {
        res.status(200).json({ success: true });
    }
});
async function mergeOrders() {
    try {
        const mergedOrders = await findAndMergeOngoingOrders();
        return { success: true, data: mergedOrders };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
//获取合并后的订单信息
app.get('/api/orders', async (req, res) => {
    try {
        const { success, data } = await mergeOrders();
        if (success) {
            res.json(data);
        } else {
            res.status(500).json({ message: 'Failed to merge orders', error: data.error }); // 如果失败，返回错误信息  
        }
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message }); // 处理其他可能的错误  
    }
});

// 检查库存并处理订单的路由
app.get('/api/checkInventory', async (req, res) => {
    const { orderId, quantity } = req.query
    console.log(orderId, quantity);
    try {
        //根据orderId从orders表中获取product_id、initiator_or_supplier、destination和phone的值并解构
        const results = await connection.query('SELECT * FROM orders WHERE order_id = ?', [orderId]);
        console.log('orderDetails:', results);
        const { product_id, destination, phone, initiator_or_supplier } = results[0];
        const stock = await connection.query('SELECT quantity FROM products WHERE id = ?', [product_id]);
        if (stock < quantity) {
            // 库存不足，计算需要补货的数量
            const replenishmentNeeded = await calculateReplenishment(product_id) + quantity - stock;
            res.json({ error: '库存不足', product_id, needToStock: replenishmentNeeded });
        } else {
            // 库存足够，仓库发货产生物流订单并更改订单状态
            const logistics = await dispatchLogistics(orderId, product_id, quantity, destination, phone, initiator_or_supplier);
            await updateOrderStatus(orderId, 'completed');
            res.json({ success: true, orderId, logistics });
        }
    } catch (error) {
        console.error('请求失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 11. 查询所有物流单信息
app.get('/api/logistics', (req, res) => {
    const sql = 'SELECT * FROM logistics ORDER BY FIELD(status, "ongoing", "completed", "failed")';
    connection.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});
app.get('/api/getproductname', (req, res) => {
    const { productId } = req.query;
    const sql = 'SELECT name FROM products WHERE id = ?';
    connection.query(sql, [productId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: '数据库查询错误' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: '产品未找到' });
        }
        res.json(results[0]);
    });
})
// 3. 分发物流函数
async function dispatchLogistics(orderId, productId, quantity, destination, phone, name) {
    const maxShipment = await getMaxShipment(productId);
    const logistics = [];

    async function createLogisticsOrder(orderId, productId, quantity, destination, phone, name) {
        const pickcode = generateRandomString();
        const result = await connection.query(
            'INSERT INTO Logistics (order_id, product_id, quantity, destination, phone, status,initiator,pickcode) VALUES (?, ?, ?, ?, ?, ?,?,?)',
            [orderId, productId, quantity, destination, phone, 'ongoing', name, pickcode]
        );
        return result.insertId;
    }

    while (quantity > 0) {
        console.log('quantity, maxShipment:', quantity, maxShipment);
        const shipmentQuantity = Math.min(quantity, maxShipment);
        logistics.push(await createLogisticsOrder(orderId, productId, shipmentQuantity, destination, phone, name));
        await decreaseStock(productId, shipmentQuantity);
        quantity -= shipmentQuantity;
    }

    return logistics;
}

// 4. 补货统计函数
async function calculateReplenishment(productId) {
    const ongoingSellingOrders = await getOngoingSellingOrders(productId); // 获得待处理的出库订单所需要的对应商品的总数量
    const ongoingPurchaseOrders = await getOngoingPurchaseOrders(productId); // 获得入库的待处理的商品的总数量
    const safeStock = await getSafeStock(productId);

    return ongoingSellingOrders + safeStock - ongoingPurchaseOrders;
}


function generateRandomString() {
    return uuidv4().replace(/-/g, '').slice(0, 6); // 生成 UUID 并去掉连接符，取前 19 位
}

// 1. 查询库存
async function queryStock(productId) {
    const result = await connection.query('SELECT quantity FROM products WHERE id = ?', [productId]);
    console.log(result);
    return result[0] ? result[0].quantity : 0;
}

// 2. 保存订单
// 3. 更新订单状态
async function updateOrderStatus(orderId, status) {
    await connection.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, orderId]);
}

async function getOrderDetails(order_id) {
    const rows = await connection.query('SELECT * FROM orders WHERE order_id = ?', [order_id]);
    console.log(rows);
    return rows[0];
}

async function increaseStock(product_id, quantity) {
    const [result] = await connection.execute('UPDATE products SET stock = stock + ? WHERE id = ?', [quantity, product_id]);
    return result.affectedRows;
}
// 6. 减少库存
async function decreaseStock(productId, quantity) {
    await connection.query('UPDATE products SET quantity = quantity - ? WHERE id = ?', [quantity, productId]);
}

// 7. 获取最大物流发货量
async function getMaxShipment(productId) {
    const result = await connection.query('SELECT max_d_quantity FROM products WHERE id = ?', [productId]);
    return result[0] ? result[0].max_d_quantity : 0;
}

// 8. 查询ongoing状态的selling类订单
async function getOngoingSellingOrders(productId) {
    const result = await connection.query(
        'SELECT SUM(quantity) AS total FROM orders WHERE product_id = ? AND status = ? AND order_type = ?',
        [productId, 'ongoing', 'selling']
    );
    return result[0] ? result[0].total : 0;
}

// 9. 查询ongoing状态的purchase类订单
async function getOngoingPurchaseOrders(productId) {
    const result = await connection.query(
        'SELECT SUM(quantity) AS total FROM orders WHERE product_id = ? AND status = ? AND order_type = ?',
        [productId, 'ongoing', 'purchase']
    );
    return result[0] ? result[0].total : 0;
}

// 10. 查询安全库存
async function getSafeStock(productId) {
    const result = await connection.query('SELECT safety_stock FROM products WHERE id = ?', [productId]);
    return result[0] ? result[0].safety_stock : 0;
}

// 12. 查询并合并ongoing状态的订单
async function findAndMergeOngoingOrders() {
    // 首先获取数据库中的特有的组合
    // const combinations = await connection.query(
    //     'SELECT DISTINCT initiator_or_supplier, product_id, destination, price FROM orders WHERE status = ? AND order_type = ?',
    //     ['ongoing', 'selling']
    // );

    const combinations = await connection.query(
        'SELECT initiator_or_supplier, product_id, destination, price, COUNT(*) AS count ' +
        'FROM Orders ' +
        'WHERE status = ? AND order_type = ? ' +
        'GROUP BY initiator_or_supplier, product_id, destination, price ' +
        'HAVING COUNT(*) >= 2;',
        ['ongoing', 'selling']
    );

    for (const combination of combinations) {
        const totalQuantity = await connection.query(
            'SELECT SUM(quantity) AS total FROM orders WHERE status = ? AND product_id = ? AND destination = ? AND initiator_or_supplier = ? AND order_type = ?',
            ['ongoing', combination.product_id, combination.destination, combination.initiator_or_supplier, 'selling']
        );
        const total = totalQuantity[0].total;

        console.log('combination:', combination);
        console.log(total);
        // 删除旧的订单
        await connection.query(
            'DELETE FROM orders WHERE status = ? AND product_id = ? AND destination = ? AND initiator_or_supplier = ? AND order_type = ?',
            ['ongoing', combination.product_id, combination.destination, combination.initiator_or_supplier, 'selling']
        );

        const sql = `
        INSERT INTO Orders 
        (order_type, status, initiator_or_supplier, destination, product_id, quantity, price,phone) 
        VALUES (?, ?, ?, ?, ?, ?, ?,?)
        `;
        const addorder = await connection.query(sql, [
            'selling',
            'ongoing',
            combination.initiator_or_supplier,
            combination.destination,
            combination.product_id,
            total,
            combination.price,
            combination.phone,
        ]);
        console.log('Insert result:', addorder);
    }
    // 返回所有订单信息
    //const allOrders = await connection.query('SELECT * FROM orders ORDER BY FIELD(status, "ongoing", "complete", "failed")');
    const allOrders = await connection.query(
        'SELECT ' +
        'o.order_id, ' +
        'o.order_type, ' +
        'o.status, ' +
        'DATE_FORMAT(o.time, \'%Y-%m-%d\') as time, ' +
        'o.initiator_or_supplier, ' +
        'o.destination, ' +
        'o.phone, ' +
        'o.product_id, ' +
        'o.quantity, ' +
        'o.price, ' +
        'o.remarks, ' +
        'p.name, ' +
        'p.image ' +
        'FROM Orders o ' +
        'JOIN Products p ON o.product_id = p.id ' +
        'ORDER BY FIELD(o.status, "ongoing", "completed", "failed")'
    );
    return allOrders;
}

// 启动服务器  
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});