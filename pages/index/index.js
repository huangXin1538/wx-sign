Page({
  data: {},

  goToUpload() {
    wx.navigateTo({
      url: '/pages/upload/upload'
    })
  },

  goToContracts() {
    wx.navigateTo({
      url: '/pages/contracts/contracts'
    })
  }
})
