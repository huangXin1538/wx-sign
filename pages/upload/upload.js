Page({
  data: {
    tempFilePath: '',
    fileName: '',
    phone: '',
    canSubmit: false
  },

  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles[0]
        this.setData({
          tempFilePath: file.path,
          fileName: file.name
        })
      }
    })
  },

  inputPhone(e) {
    const phone = e.detail.value
    this.setData({
      phone,
      canSubmit: phone.length === 11 && this.data.tempFilePath
    })
  },

  async uploadContract() {
    if (!this.data.canSubmit) return

    wx.showLoading({
      title: '上传中...',
    })

    try {
      // 上传文件到云存储
      const cloudPath = `contracts/${Date.now()}-${this.data.fileName}`
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath: this.data.tempFilePath
      })

      // 在云数据库中创建合同记录
      const db = wx.cloud.database()
      await db.collection('contracts').add({
        data: {
          fileID: uploadRes.fileID,
          fileName: this.data.fileName,
          signerPhone: this.data.phone,
          status: 'pending',
          createTime: db.serverDate()
        }
      })

      wx.hideLoading()
      wx.showToast({
        title: '发送成功',
        icon: 'success'
      })

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)

    } catch (err) {
      wx.hideLoading()
      wx.showToast({
        title: '上传失败',
        icon: 'error'
      })
      console.error('上传失败：', err)
    }
  }
})
