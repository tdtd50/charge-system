const api = require('../../utils/request')
const app = getApp()

Page({
  data: {
    orders: []
  },

  onLoad() {
    this.loadOrders()
  },

  async loadOrders() {
    const userId = app.globalData.userId
    if (!userId) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }

    wx.showLoading({ title: '加载中...' })

    try {
      const res = await api.getAllOrders(userId)
      if (res.code === 200) {
        this.setData({ orders: res.data })
      }
    } catch (error) {
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  }
})
