const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

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

// 获取商品信息  
app.get('/api/products', (req, res) => {
    const sql = 'SELECT * FROM products';
    connection.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.get('/api/orders', async (req, res) => {
    // const sql = 'SELECT * FROM orders';
    // connection.query(sql, (err, results) => {
    //     if (err) throw err;
    //     res.json(results);
    // });

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

// 检查库存并处理订单的路由
app.get('/api/checkInventory', async (req, res) => {
    const { productId, quantity } = req.query;
    try {
        const stock = await queryStock(productId);
        if (stock < quantity) {
            // 库存不足，计算需要补货的数量
            const replenishmentNeeded = await calculateReplenishment(productId) + quantity - stock;
            // 保存订单状态为 'ongoing' 并返回需要补货的信息
            await saveOrder(productId, quantity, 'initator', 'destination', 'initator_phone', 'ongoing', 'selling');
            res.json({ error: '库存不足', productId, needToStock: replenishmentNeeded });
        } else {
            // 库存足够，创建订单并发货
            const orderId = await saveOrder('initator', productId, quantity, 'destination', 'initator_phone', 'ongoing', 'selling');
            const logistics = await dispatchLogistics(orderId, productId, quantity);
            await updateOrderStatus(orderId, 'complete');
            res.json({ success: true, orderId, logistics });
        }
    } catch (error) {
        console.error('请求失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});


async function completeInboundOrder(order_id) {
    console.log('Entering completeInboundOrder function'); // 调试语句
    try {
        const [results] = await connection.promise().query('SELECT * FROM orders WHERE order_id = ?', [order_id]);
        console.log('Query results:', results); // 调试语句
        if (results.length === 0) {
            throw new Error('订单不存在');
        }
        const orderDetails = results[0];
        // 更新库存，确保使用正确的字段
        const affectedRows = await connection.promise().query('UPDATE products SET stock = stock + ? WHERE id = ?', [orderDetails.quantity, orderDetails.product_id]);
        console.log('Affected rows:', affectedRows); // 调试语句
        if (affectedRows.affectedRows === 0) {
            throw new Error('库存更新失败');
        }
        return { success: true };
    } catch (error) {
        console.error('Error in completeInboundOrder:', error); // 调试语句
        return { error: error.message };
    }
}

// 使用这个函数在路由处理程序中
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
// async function completeInboundOrder(orderId) {
//     const orderDetails = await getOrderDetails(orderId); // 调取订单信息（主要是获得补货数量）
//     const re = await increaseStock(orderDetails.productId, orderDetails.quantity)
//     if (re == 0) {
//         return { error: '确认失败，请查看订单id是否正确', };
//     } // 增加补货数量
//     return { success: true, re }; //返回受影响的行数
// }
// app.post('/api/completedorder', async (req, res) => {
//     try {
//         const { orderId } = req.body;
//         const result = await completeInboundOrder(orderId);
//         if (result.error) {
//             res.status(400).send({ message: result.error });
//         } else {
//             res.status(200).send({ success: true, rowsAffected: result.re });
//         }
//     } catch (err) {
//         console.error('Error handling complete inbound order request:', err);
//         res.status(500).send({ message: 'Error completing inbound order: ' + err.message });
//     }
// });
// 3. 分发物流函数
async function dispatchLogistics(orderId, productId, quantity) {
    const maxShipment = await getMaxShipment(productId); // 获得最大物流发货限制
    const logistics = [];

    //发出一个物流单，返回物流单在数据库中的id
    async function createLogisticsOrder(orderId, productId, quantity, name, destination, phone, time, status) {
        const result = await connection.query(
            'INSERT INTO Logistics (orderId, productId, quantity,name,destination,phone,time,status) VALUES (?, ?, ?, ?, ?)',
            [orderId, productId, quantity, name, destination, phone, time, status]);
        return result.insertId;
    }

    //根据数据库返回物流单，然后返回物流单id的列表
    while (quantity > 0) {
        const shipmentQuantity = Math.min(quantity, maxShipment);
        logistics.push(await createLogisticsOrder(orderId, productId, shipmentQuantity));
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

// 6. 合并订单信息函数
async function mergeOrders() {
    try {
        const mergedOrders = await findAndMergeOngoingOrders();
        return { success: true, data: mergedOrders };
    } catch (error) {
        return { success: false, error: error.message };
    }
}


// 以下是一些帮助函数，用于与数据库交互
const util = require('util');

// 将回调函数的数据库查询转为 Promise
connection.query = util.promisify(connection.query);

// 1. 查询库存
async function queryStock(productId) {
    const result = await connection.query('SELECT quantity FROM products WHERE id = ?', [productId]);
    return result[0] ? result[0].quantity : 0;
}

// 2. 保存订单
async function saveOrder(productId, quantity, initator, destination, initator_phone, status, type) {
    const result = await connection.query(
        'INSERT INTO orders (product_id, quantity, initator, destination, initator_phone, status, order_type) VALUES (?, ?, ?, ?, ?,?,?)',
        [productId, quantity, initator, destination, initator_phone, status, type]
    );
    return result.insertId;
}

// 3. 更新订单状态
async function updateOrderStatus(orderId, status) {
    await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
}

// // 4. 获取订单详情
// async function getOrderDetails(orderId) {
//     const result = await connection.query('SELECT * FROM orders WHERE id = ?', [orderId]);
//     return result[0];
// }

// // 5. 增加库存
// async function increaseStock(productId, quantity) {
//     const result = await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [quantity, productId]);
//     return result.result.affectedRows
// }

async function getOrderDetails(order_id) {
    const rows = connection.query('SELECT * FROM orders WHERE order_id = ?', [order_id]);
    return rows[0];
}

async function increaseStock(product_id, quantity) {
    const [result] = await connection.execute('UPDATE products SET stock = stock + ? WHERE id = ?', [quantity, product_id]);
    return result.affectedRows;
}
// 6. 减少库存
async function decreaseStock(productId, quantity) {
    await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, productId]);
}

// 7. 获取最大物流发货量
async function getMaxShipment(productId) {
    const result = await connection.query('SELECT max_shipment FROM products WHERE id = ?', [productId]);
    return result[0] ? result[0].max_shipment : 0;
}

// 8. 查询ongoing状态的selling类订单
async function getOngoingSellingOrders(productId) {
    const result = await connection.query(
        'SELECT SUM(quantity) AS total FROM orders WHERE product_id = ? AND status = ? AND category = ?',
        [productId, 'ongoing', 'selling']
    );
    return result[0] ? result[0].total : 0;
}

// 9. 查询ongoing状态的purchase类订单
async function getOngoingPurchaseOrders(productId) {
    const result = await connection.query(
        'SELECT SUM(quantity) AS total FROM orders WHERE product_id = ? AND status = ? AND category = ?',
        [productId, 'ongoing', 'purchase']
    );
    return result[0] ? result[0].total : 0;
}

// 10. 查询安全库存
async function getSafeStock(productId) {
    const result = await connection.query('SELECT safe_stock FROM products WHERE id = ?', [productId]);
    return result[0] ? result[0].safe_stock : 0;
}

// 11. 查询所有物流单信息
async function queryAllLogistics() {
    const result = await connection.query('SELECT * FROM logistics');
    return result;
}

// 12. 查询并合并ongoing状态的订单
async function findAndMergeOngoingOrders() {
    const mergedOrders = [];
    // 首先获取数据库中的特有的组合
    const combinations = await connection.query(
        'SELECT DISTINCT initiator_or_supplier, product_id, destination FROM orders WHERE status = ? AND order_type = ?',
        ['ongoing', 'selling']
    );

    for (const combination of combinations) {
        const totalQuantity = await connection.query(
            'SELECT SUM(quantity) AS total FROM orders WHERE status = ? AND product_id = ? AND destination = ? AND initiator_or_supplier = ? AND order_type = ?',
            ['ongoing', combination.product_id, combination.destination, combination.initiator_or_supplier, 'selling']
        );
        const total = totalQuantity[0].total;

        // 删除旧的订单
        await connection.query(
            'DELETE FROM orders WHERE status = ? AND product_id = ? AND destination = ? AND initiator_or_supplier = ? AND order_type = ?',
            ['ongoing', combination.product_id, combination.destination, combination.initiator_or_supplier, 'selling']
        );

        // 增加新的订单
        const newOrderId = await saveOrder(combination.product_id, total, combination.initiator_or_supplier, combination.destination, '123456', 'ongoing', 'selling');
        mergedOrders.push(newOrderId);
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