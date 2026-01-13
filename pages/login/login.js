const api = require('../../utils/request')
const app = getApp()

Page({
  data: {
    number: '',
    password: ''
  },

  onNumberInput(e) {
    this.setData({ number: e.detail.value })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value })
  },

  async handleLogin() {
    const { number, password } = this.data

    if (!number || !password) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '登录中...' })

    try {
      const res = await api.userLogin({ number, password })

      if (res.code === 200) {
        // 保存用户信息和token
        wx.setStorageSync('userInfo', res.data)
        if (res.token) {
          wx.setStorageSync('token', res.token)
          app.globalData.token = res.token
        }
        app.globalData.userInfo = res.data
        app.globalData.userId = res.data.id

        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })

        // 跳转到充电页面
        setTimeout(() => {
          wx.switchTab({ url: '/pages/charge/charge' })
        }, 1000)
      } else {
        wx.showToast({
          title: res.message || '登录失败',
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

  handleRegister() {
    wx.navigateTo({ url: '/pages/register/register' })
  }
})
