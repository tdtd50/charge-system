App({
  globalData: {
    userInfo: null,
    userId: null
  },

  onLaunch() {
    // 检查登录状态
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
      this.globalData.userId = userInfo.id
    }
  }
})
