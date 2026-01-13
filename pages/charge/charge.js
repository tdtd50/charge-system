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
    timer: null,
    statusCheckTimer: null, // 状态检查定时器
    currentOrderId: null // 当前充电订单ID
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
    this.checkAndRestoreChargingStatus()
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

  // 检查并恢复充电状态
  async checkAndRestoreChargingStatus() {
    const userId = app.globalData.userId
    if (!userId) return

    try {
      const res = await api.getChargingOrders(userId)
      if (res.code === 200 && res.data && res.data.length > 0) {
        // 有充电中的订单，恢复充电状态
        const order = res.data[0]
        const remainingTime = Math.ceil(order.remaining_time || 0)
        const totalTime = order.cost || 0

        if (remainingTime > 0) {
          this.setData({
            isCharging: true,
            remainingTime: remainingTime,
            totalTime: totalTime,
            progress: ((totalTime - remainingTime) / totalTime) * 100,
            currentOrderId: order.id
          })

          // 启动倒计时和状态检查
          this.startCountdown()
          this.startStatusCheck()
        }
      } else {
        // 没有充电中的订单，确保清除充电状态
        this.stopCharging()
      }
    } catch (error) {
      console.error('检查充电状态失败', error)
    }
  },

  // 定期检查充电状态
  async checkChargingStatus() {
    const userId = app.globalData.userId
    if (!userId || !this.data.isCharging) return

    try {
      const res = await api.getChargingOrders(userId)

      if (res.code === 200) {
        if (!res.data || res.data.length === 0) {
          // 后端没有充电中的订单，说明充电已停止（可能是故障断电、手动停止等）
          console.log('检测到充电已停止')
          this.stopCharging('充电已停止')
          return
        }

        // 有充电订单，更新剩余时间
        const order = res.data[0]
        const remainingTime = Math.ceil(order.remaining_time || 0)
        const totalTime = order.cost || this.data.totalTime

        if (remainingTime <= 0) {
          // 充电时间已用完
          this.stopCharging('充电完成')
        } else {
          // 更新剩余时间和进度
          const progress = ((totalTime - remainingTime) / totalTime) * 100
          this.setData({
            remainingTime: remainingTime,
            totalTime: totalTime,
            progress: progress
          })
        }
      }
    } catch (error) {
      console.error('检查充电状态失败', error)
    }
  },

  // 启动状态检查定时器
  startStatusCheck() {
    // 清除旧的定时器
    if (this.data.statusCheckTimer) {
      clearInterval(this.data.statusCheckTimer)
    }

    // 每10秒检查一次状态
    const statusCheckTimer = setInterval(() => {
      this.checkChargingStatus()
    }, 10000)

    this.setData({ statusCheckTimer })
  },

  // 停止充电
  stopCharging(message) {
    // 清除定时器
    if (this.data.timer) {
      clearInterval(this.data.timer)
    }
    if (this.data.statusCheckTimer) {
      clearInterval(this.data.statusCheckTimer)
    }

    // 更新状态
    this.setData({
      isCharging: false,
      timer: null,
      statusCheckTimer: null,
      currentOrderId: null
    })

    // 显示提示
    if (message) {
      wx.showModal({
        title: '提示',
        content: message,
        showCancel: false,
        success: () => {
          // 刷新用户信息
          this.loadUserInfo()
        }
      })
    }
  },

  selectAmount(e) {
    const amount = parseInt(e.currentTarget.dataset.amount)
    this.setData({ selectedAmount: amount })
    console.log('选择金额:', amount)
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
          progress: 0,
          currentOrderId: res.data?.id || null
        })

        this.startCountdown()
        this.startStatusCheck() // 启动状态检查

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
    // 清除旧的定时器
    if (this.data.timer) {
      clearInterval(this.data.timer)
    }

    const timer = setInterval(() => {
      let { remainingTime, totalTime } = this.data

      if (remainingTime <= 0) {
        this.stopCharging('充电完成，感谢使用！')
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

  onHide() {
    // 页面隐藏时不清除定时器，保持充电状态
  },

  onUnload() {
    // 页面卸载时清除定时器
    if (this.data.timer) {
      clearInterval(this.data.timer)
    }
    if (this.data.statusCheckTimer) {
      clearInterval(this.data.statusCheckTimer)
    }
  }
})
