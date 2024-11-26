const app = getApp()

Page({
  data: {
    template: null,
    loading: true,
    error: null,
    fileContent: ''
  },

  onLoad: async function(options) {
    if (!options.id) {
      this.showError('参数错误')
      return
    }

    await this.loadTemplate(options.id)
  },

  async loadTemplate(id) {
    try {
      wx.showLoading({
        title: '加载中...'
      })

      const db = wx.cloud.database()
      const { data } = await db.collection('templates').doc(id).get()
      
      if (!data) {
        throw new Error('模板不存在')
      }

      if (data.fileID) {
        const content = await this.loadFileContent(data.fileID)
        this.setData({
          template: {
            ...data,
            content: content,
            createTime: new Date(data.createTime).toLocaleString()
          },
          loading: false,
          error: null
        })
      } else {
        throw new Error('模板文件不存在')
      }
    } catch (error) {
      console.error('加载模板失败:', error)
      this.showError(error.message || '加载失败')
    } finally {
      wx.hideLoading()
    }
  },

  async loadFileContent(fileID) {
    try {
      console.log('开始解析文件:', fileID)
      const result = await wx.cloud.callFunction({
        name: 'parseWord',
        data: { fileID }
      })

      console.log('解析结果:', result)

      if (!result.result || !result.result.success) {
        throw new Error(result.result?.error || '解析文件失败')
      }

      const html = this.processHtmlContent(result.result.data.html)
      return html

    } catch (error) {
      console.error('解析文件失败:', error)
      throw new Error('无法读取文件内容：' + error.message)
    }
  },

  processHtmlContent(html) {
    if (!html) return '文件内容为空'
    
    // 基本清理
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    
    // 处理标题样式
    html = html.replace(/<h1/gi, '<h1 style="font-size:40rpx;font-weight:bold;margin:24rpx 0;"')
    html = html.replace(/<h2/gi, '<h2 style="font-size:36rpx;font-weight:bold;margin:20rpx 0;"')
    html = html.replace(/<h3/gi, '<h3 style="font-size:32rpx;font-weight:bold;margin:16rpx 0;"')
    
    // 处理段落样式
    html = html.replace(/<p/gi, '<p style="margin:16rpx 0;line-height:1.8;text-align:justify;"')
    
    // 处理图片
    html = html.replace(/<img/gi, '<img style="max-width:100%;height:auto;margin:16rpx 0;"')
    
    // 处理表格
    html = html.replace(/<table/gi, '<table style="width:100%;border-collapse:collapse;margin:16rpx 0;"')
    html = html.replace(/<td/gi, '<td style="border:1px solid #ddd;padding:8rpx;"')
    html = html.replace(/<th/gi, '<th style="border:1px solid #ddd;padding:8rpx;background:#f5f5f5;"')
    
    // 处理列表
    html = html.replace(/<ul/gi, '<ul style="margin:16rpx 0;padding-left:40rpx;"')
    html = html.replace(/<ol/gi, '<ol style="margin:16rpx 0;padding-left:40rpx;"')
    html = html.replace(/<li/gi, '<li style="margin:8rpx 0;"')
    
    // 添加整体容器样式
    html = `<div style="font-size:28rpx;line-height:1.8;color:#333;padding:20rpx;">${html}</div>`
    
    return html
  },

  showError(message) {
    this.setData({
      error: message,
      loading: false
    })
    wx.showToast({
      title: message,
      icon: 'error'
    })
    setTimeout(() => wx.navigateBack(), 1500)
  },

  async sendToSign() {
    if (!this.data.template || !this.data.template._id) {
      wx.showToast({
        title: '模板数据错误',
        icon: 'error'
      })
      return
    }

    try {
      const db = wx.cloud.database()
      
      // 创建合同记录
      const contractResult = await db.collection('contracts').add({
        data: {
          templateId: this.data.template._id,
          templateName: this.data.template.name,
          fileID: this.data.template.fileID,
          status: 'pending',
          type: 'sent',
          createTime: db.serverDate()
        }
      })

      if (!contractResult._id) {
        throw new Error('创建合同失败')
      }

      // 跳转到选择签署人页面
      wx.navigateTo({
        url: `/pages/select-signer/select-signer?contractId=${contractResult._id}`,
        fail: (err) => {
          console.error('跳转失败:', err)
          throw new Error('页面跳转失败')
        }
      })

    } catch (error) {
      console.error('发起签署失败:', error)
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'error'
      })
    }
  },

  back() {
    wx.navigateBack()
  }
}) 