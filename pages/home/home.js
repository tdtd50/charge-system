const api = require('../../utils/request')
const app = getApp()

Page({
  data: {
    userInfo: {},
    showRechargeModal: false,
    rechargeAmount: ''
  },

  onShow() {
    this.loadUserInfo()
  },

  async loadUserInfo() {
    const userId = app.globalData.userId
    if (!userId) {
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }

    try {
      const res = await api.getUserInfo(userId)
      if (res.code === 200) {
        this.setData({ userInfo: res.data })
      }
    } catch (error) {
      console.error('加载用户信息失败', error)
    }
  },

  handleRecharge() {
    this.setData({
      showRechargeModal: true,
      rechargeAmount: ''
    })
  },

  closeModal() {
    this.setData({ showRechargeModal: false })
  },

  preventClose() {
    // 阻止事件冒泡
  },

  onRechargeInput(e) {
    this.setData({ rechargeAmount: e.detail.value })
  },

  async confirmRecharge() {
    const { rechargeAmount, userInfo } = this.data
    const amount = parseFloat(rechargeAmount)

    if (!amount || amount <= 0) {
      wx.showToast({
        title: '请输入有效金额',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '充值中...' })

    try {
      const res = await api.recharge({
        user_id: userInfo.id,
        amount: amount
      })

      if (res.code === 200) {
        wx.showToast({
          title: '充值成功',
          icon: 'success'
        })

        this.closeModal()
        this.loadUserInfo()
      } else {
        wx.showToast({
          title: res.message || '充值失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          app.globalData.userInfo = null
          app.globalData.userId = null

          wx.reLaunch({ url: '/pages/login/login' })
        }
      }
    })
  },

  goToOrders() {
    wx.navigateTo({ url: '/pages/orders/orders' })
  },

  goToChargingOrders() {
    wx.navigateTo({ url: '/pages/charging-orders/charging-orders' })
  },

  goToFinishedOrders() {
    wx.navigateTo({ url: '/pages/finished-orders/finished-orders' })
  }
})
