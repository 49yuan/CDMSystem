const mysql = require('mysql');

// 创建数据库连接
const connection = mysql.createConnection({
    host: '106.53.180.137',
    user: 'ERPUser',
    password: 'ERP_Data@2024',
    database: 'ERP'
});

// 1. 确认订单函数
async function confirmOrder(productId, quantity, initator, destination, initator_phone) {
    // 查询库存
    const stock = await queryStock(productId);
    if (stock < quantity) {
        // 库存不足，返回错误信息
        const replenishmentNeeded = await calculateReplenishment(productId) + quantity - stock; //所有所有还没有进行进行补货处理的订单+新加上的需要补货处理的订单-目前库存
        await saveOrder(productId, quantity, initator, destination, initator_phone, 'ongoing', 'selling');
        return {error: '库存不足', productId, replenishmentNeeded};
    }

    // 库存足够，创建订单
    const orderId = await saveOrder(initator, productId, quantity, destination, 'ongoing', 'selling');
    const logistics = await dispatchLogistics(orderId, productId, quantity);
    await updateOrderStatus(orderId, 'complete');

    return {success: true, orderId, logistics};
}

// 2. 入库订单完成函数
async function completeInboundOrder(orderId) {
    const orderDetails = await getOrderDetails(orderId); // 调取订单信息（主要是获得补货数量）
    const re = await increaseStock(orderDetails.productId, orderDetails.quantity)
    if (re == 0) {
        return {error: '确认失败，请查看订单id是否正确',};
    } // 增加补货数量
    return {success: true, re}; //返回受影响的行数
}

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

// 5. 返回所有物流单信息函数
async function getAllLogistics() {
    const logistics = await queryAllLogistics();
    if (logistics.length === 0) {
        return {error: '没有找到物流单信息'};
    }
    return {success: true, logistics};
}

// 6. 合并订单信息函数
async function mergeOrders() {
    const mergedOrders = await findAndMergeOngoingOrders();
    return {success: true, mergedOrders};
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

// 4. 获取订单详情
async function getOrderDetails(orderId) {
    const result = await connection.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    return result[0];
}

// 5. 增加库存
async function increaseStock(productId, quantity) {
    const result = await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [quantity, productId]);
    return result.result.affectedRows
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
    // 合并逻辑
    const mergedOrders = [];
    var deletedOrders = 0;
    // 首先获取数据库中的特有的组合
    const combinations = await connection.query('SELECT DISTINCT initiator_or_supplier, product_id, destination FROM orders WHERE status = ? AND order_type = ?', ['ongoing', 'selling']);
    // 一个组合一个组合的合并+删除
    for (const combination of combinations) {
        const totalQuantity = await connection.query(
            'SELECT SUM(quantity) FROM orders WHERE status = ? AND product_id = ? AND destination = ? AND initiator_or_supplier = ? AND order_type = ?'
                ['ongoing', combination.product_id, combination.destination, combination.initiator_or_supplier,'selling']);
        // 删除
        deletedOrders += await connection.query('DELETE FROM orders WHERE status = ? AND product_id = ? AND destination = ? AND initiator_or_supplier = ? AND order_type = ?', ['ongoing', combination.product_id, combination.destination, combination.initiator_or_supplier,'selling']);
        // 增加
        mergeOrders.push = await saveOrder(combination.product_id, totalQuantity, combination.initiator_or_supplier, combination.destination, '123456', 'ongoing', 'selling');

    }
    // 返回所有订单信息
    const allOrders = await connection.query('SELECT * FROM orders ORDER BY FIELD(status, "ongoing", "complete", "failed")');
    return allOrders;
}


// 连接数据库
connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL Database!');
});
