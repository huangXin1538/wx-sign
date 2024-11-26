const app = getApp()

Page({
  data: {
    contractId: '',
    loading: false,
    signerName: '',
    guardianName: '',
    formComplete: false
  },

  onLoad(options) {
    if (options.contractId) {
      this.setData({
        contractId: options.contractId
      })
    }
  },

  onInputSignerName(e) {
    this.setData({
      signerName: e.detail.value
    }, this.checkForm)
  },

  onInputGuardianName(e) {
    this.setData({
      guardianName: e.detail.value
    }, this.checkForm)
  },

  checkForm() {
    const formComplete = this.data.signerName.trim() && this.data.guardianName.trim()
    this.setData({ formComplete })
  },

  async submitAndShare() {
    if (!this.data.formComplete) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    try {
      this.setData({ loading: true })
      const db = wx.cloud.database()

      // 更新合同信息
      await db.collection('contracts').doc(this.data.contractId).update({
        data: {
          signerName: this.data.signerName,
          guardianName: this.data.guardianName,
          sendTime: db.serverDate()
        }
      })

      // 获取合同信息用于分享
      const { data: contract } = await db.collection('contracts').doc(this.data.contractId).get()

      // 设置分享参数
      this.setData({
        shareData: {
          title: `${contract.templateName} - 待签署`,
          path: `/pages/sign/sign?id=${this.data.contractId}`,
          imageUrl: '/images/share-cover.png'
        }
      })

      wx.showToast({
        title: '请转发给签署人',
        icon: 'success'
      })

    } catch (error) {
      console.error('准备分享失败:', error)
      wx.showToast({
        title: '操作失败',
        icon: 'error'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  onShareAppMessage() {
    if (this.data.shareData) {
      return this.data.shareData
    }
    return {
      title: '合同签署',
      path: '/pages/contracts/contracts'
    }
  }
}) 