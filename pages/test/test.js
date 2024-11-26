Page({
  data: {
    contractId: ''
  },

  async onLoad() {
    wx.showLoading({ title: '准备测试...' })
    try {
      // 调用云函数创建测试合同
      const result = await wx.cloud.callFunction({
        name: 'createTestContract'
      })

      if (result.result.success) {
        this.setData({
          contractId: result.result.contractId
        })
      } else {
        throw new Error('创建测试合同失败')
      }

      wx.hideLoading()
    } catch (err) {
      wx.hideLoading()
      wx.showToast({
        title: '测试准备失败',
        icon: 'error'
      })
      console.error(err)
    }
  },

  // 跳转到签名页面
  goToSign() {
    if (!this.data.contractId) {
      wx.showToast({
        title: '请等待合同创建',
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url: `/pages/sign/sign?id=${this.data.contractId}&mode=sign`
    })
  }
})
