// 后端API地址（需要修改为实际服务器地址）
const BASE_URL = 'http://192.168.26.7:5000/api'

// 封装请求
function request(options) {
  return new Promise((resolve, reject) => {
    // 获取token（安全检查）
    let token = null
    try {
      const app = getApp()
      if (app && app.globalData) {
        token = app.globalData.token
      }
    } catch (e) {
      console.warn('getApp 调用失败，尝试从缓存获取 token')
    }

    // 如果 app 中没有，尝试从缓存获取
    if (!token) {
      token = wx.getStorageSync('token')
    }

    // 构建请求头
    const header = {
      'Content-Type': 'application/json'
    }

    // 如果存在token，添加到请求头
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }

    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: header,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          // token过期或无效，跳转到登录页
          wx.showToast({
            title: '请重新登录',
            icon: 'none'
          })
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/login/login' })
          }, 1500)
          reject(res)
        } else {
          wx.showToast({
            title: res.data?.message || '请求失败',
            icon: 'none'
          })
          reject(res)
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '网络连接失败',
          icon: 'none'
        })
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
