const api = require('../../utils/request')
const app = getApp()

Page({
  data: {
    number: '',
    name: '',
    password: '',
    confirmPassword: ''
  },

  onNumberInput(e) {
    this.setData({ number: e.detail.value })
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value })
  },

  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value })
  },

  async handleRegister() {
    const { number, name, password, confirmPassword } = this.data

    // 验证输入
    if (!number || !name || !password || !confirmPassword) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    // 验证学号格式（假设学号为数字）
    if (!/^\d+$/.test(number)) {
      wx.showToast({
        title: '学号格式不正确',
        icon: 'none'
      })
      return
    }

    // 验证密码长度
    if (password.length < 6) {
      wx.showToast({
        title: '密码至少6位',
        icon: 'none'
      })
      return
    }

    // 验证两次密码是否一致
    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次密码不一致',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '注册中...' })

    try {
      const res = await api.userRegister({
        number,
        name,
        password
      })

      if (res.code === 200) {
        wx.showToast({
          title: '注册成功',
          icon: 'success'
        })

        // 注册成功后跳转到登录页
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/login/login' })
        }, 1500)
      } else {
        wx.showToast({
          title: res.message || '注册失败',
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

  goToLogin() {
    wx.redirectTo({ url: '/pages/login/login' })
  }
})
