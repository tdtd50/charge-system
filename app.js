App({
  globalData: {
    userInfo: null,
    userId: null,
    token: null
  },

  onLaunch(options) {
    try {
      // 检查登录状态
      const userInfo = wx.getStorageSync('userInfo')
      const token = wx.getStorageSync('token')

      if (userInfo && token) {
        this.globalData.userInfo = userInfo
        this.globalData.userId = userInfo.id
        this.globalData.token = token

        console.log('用户已登录:', userInfo)
      } else {
        console.log('用户未登录，将显示登录页')
      }
    } catch (error) {
      console.error('初始化失败:', error)
    }
  },

  onShow(options) {
    // 应用从后台进入前台时触发
  },

  onHide() {
    // 应用从前台进入后台时触发
  },

  onError(error) {
    console.error('应用错误:', error)
  }
})
