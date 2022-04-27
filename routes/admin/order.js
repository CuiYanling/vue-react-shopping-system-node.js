const express = require('express');
const router = express.Router();
// 数据库
let pool = require('../../config/mysql');

/**
 * @apiDefine Authorization
 * @apiHeader {String} Authorization 需在请求headers中设置Authorization: `Bearer ${token}`，登录/注册成功返回的token。
 */

/**
 * @api {get} /seller/order/list 获取所有账户订单列表
 * @apiDescription 获取系统中的订单列表，根据订单状态获取列表，具备分页功能
 * @apiName AdminOrderList
 * @apiGroup Order
 * @apiPermission admin
 *
 * @apiUse Authorization
 *
 * @apiQuery {Number} [pageSize=4] 一个页有多少个订单;
 * @apiQuery {Number} [pageIndex=1] 第几页;
 * @apiQuery {Number=0,3,4,5,all} status 订单状态:0-待付款，3-待发货，4-待收货，5-待评价，all-所有状态;
 *
 * @apiSampleRequest /seller/order/list
 */

router.get('/list', async function (req, res) {
    let { pageSize = 4, pageIndex = 1, status = 'all' } = req.query;
    // 计算偏移量
    let size = parseInt(pageSize);
    let offset = size * (pageIndex - 1);
    // 查询所有订单
    let order_sql = `SELECT SQL_CALC_FOUND_ROWS o.id, DATE_FORMAT(o.create_time,'%Y-%m-%d %H:%i:%s') AS create_time, o.payment, os.text AS status FROM orders o JOIN order_status os ON o.order_state = os.CODE`;
    // 附加订单状态查询
    if (status !== 'all') {
        order_sql += ` WHERE o.order_state = ${status}`;
    }
    // 按照创建时间排序
    order_sql += ` ORDER BY o.create_time DESC LIMIT ? OFFSET ?;SELECT FOUND_ROWS() as total;`;

    let [[orders, total]] = await pool.query(order_sql, [size, offset]);

    // 查询订单商品信息
    let goods_sql = `SELECT g.id, g.name, g.img_md, og.goods_num, og.goods_price FROM order_goods og JOIN goods g ON g.id = og.goods_id WHERE og.order_id = ?`;

    // 循环遍历给订单数组添加订单商品信息
    for (const order of orders) {
        let [goods] = await pool.query(goods_sql, [order.id]);
        order.goodsList = goods;
    }
    // 获取成功
    res.json({
        status: true,
        msg: "success!",
        data: orders,
        ...total[0],
    });
});
module.exports = router;
