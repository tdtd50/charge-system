const api = require('../../utils/request')
const app = getApp()

Page({
  data: {
    userInfo: {},
    selectedAmount: 1,
    isCharging: false,
    remainingTime: 0,
    totalTime: 0,
    progress: 0,
    timer: null
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  async loadUserInfo() {
    const userId = app.globalData.userId
    if (!userId) {
      wx.redirectTo({ url: '/pages/login/login' })
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

  selectAmount(e) {
    const amount = e.currentTarget.dataset.amount
    this.setData({ selectedAmount: amount })
  },

  async handleCharge() {
    const { selectedAmount, userInfo, isCharging } = this.data

    if (isCharging) {
      wx.showToast({
        title: '正在充电中',
        icon: 'none'
      })
      return
    }

    if (userInfo.remain < selectedAmount) {
      wx.showModal({
        title: '余额不足',
        content: '您的余额不足，请先充值',
        confirmText: '去充值',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/home/home' })
          }
        }
      })
      return
    }

    wx.showLoading({ title: '开始充电...' })

    try {
      const res = await api.createCharge({
        user_id: userInfo.id,
        cost: selectedAmount
      })

      if (res.code === 200) {
        wx.showToast({
          title: '充电开始',
          icon: 'success'
        })

        // 开始倒计时
        this.setData({
          isCharging: true,
          remainingTime: selectedAmount,
          totalTime: selectedAmount,
          progress: 0
        })

        this.startCountdown()

        // 刷新用户信息
        this.loadUserInfo()
      } else {
        wx.showToast({
          title: res.message || '充电失败',
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

  startCountdown() {
    const timer = setInterval(() => {
      let { remainingTime, totalTime } = this.data

      if (remainingTime <= 0) {
        clearInterval(timer)
        this.setData({
          isCharging: false,
          remainingTime: 0,
          progress: 100
        })

        wx.showModal({
          title: '充电完成',
          content: '充电已完成，感谢使用！',
          showCancel: false
        })

        // 刷新用户信息
        this.loadUserInfo()
      } else {
        remainingTime--
        const progress = ((totalTime - remainingTime) / totalTime) * 100

        this.setData({
          remainingTime,
          progress
        })
      }
    }, 60000) // 每分钟更新一次

    this.setData({ timer })
  },

  onUnload() {
    if (this.data.timer) {
      clearInterval(this.data.timer)
    }
  }
})
