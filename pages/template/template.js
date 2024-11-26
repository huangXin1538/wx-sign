// pages/template/template.js
Page({
  data: {
    template: null,
    templateId: ''
  },

  onLoad(options) {
    const { id } = options
    this.setData({ templateId: id })
    this.loadTemplateDetail(id)
  },

  async loadTemplateDetail(id) {
    try {
      wx.showLoading({ title: '加载中...' })
      
      // 从数据库获取模板详情
      const db = wx.cloud.database()
      const { data } = await db.collection('templates').doc(id).get()
      
      if (!data) {
        throw new Error('模板不存在')
      }

      this.setData({ template: data })
      wx.hideLoading()
    } catch (err) {
      console.error('加载模板详情失败：', err)
      wx.hideLoading()
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  },

  onShareAppMessage() {
    const { template, templateId } = this.data
    return {
      title: `请查看并签署${template.name}`,
      path: `/pages/sign/sign?templateId=${templateId}&mode=template`
    }
  }
})
