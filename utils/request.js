// 后端API地址（需要修改为实际服务器地址）
const BASE_URL = 'http://localhost:5000/api'

// 封装请求
function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(res)
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// 用户登录
function userLogin(data) {
  return request({
    url: '/user/login',
    method: 'POST',
    data: data
  })
}

// 用户注册
function userRegister(data) {
  return request({
    url: '/user/register',
    method: 'POST',
    data: data
  })
}

// 获取用户信息
function getUserInfo(userId) {
  return request({
    url: '/user/info/' + userId,
    method: 'GET'
  })
}

// 充值
function recharge(data) {
  return request({
    url: '/user/recharge',
    method: 'POST',
    data: data
  })
}

// 创建充电订单
function createCharge(data) {
  return request({
    url: '/user/charge',
    method: 'POST',
    data: data
  })
}

// 获取所有订单
function getAllOrders(userId) {
  return request({
    url: '/user/orders/' + userId,
    method: 'GET'
  })
}

// 获取充电中订单
function getChargingOrders(userId) {
  return request({
    url: '/user/orders/charging/' + userId,
    method: 'GET'
  })
}

// 获取已结束订单
function getFinishedOrders(userId) {
  return request({
    url: '/user/orders/finished/' + userId,
    method: 'GET'
  })
}

module.exports = {
  userLogin,
  userRegister,
  getUserInfo,
  recharge,
  createCharge,
  getAllOrders,
  getChargingOrders,
  getFinishedOrders
}
