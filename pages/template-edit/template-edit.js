// pages/template-edit/template-edit.js
const app = getApp()

Page({
  data: {
    templates: [],
    loading: false
  },

  onLoad: function() {
    this.loadTemplates()
  },

  onShow: function() {
    this.loadTemplates()
  },

  loadTemplates: async function() {
    try {
      this.setData({ loading: true })
      const db = wx.cloud.database()
      const templates = await db.collection('templates')
        .orderBy('createTime', 'desc')
        .get()
      
      this.setData({
        templates: templates.data.map(item => ({
          ...item,
          createTime: new Date(item.createTime).toLocaleString()
        }))
      })
    } catch (error) {
      console.error('加载模板失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  uploadWord: async function() {
    try {
      // 选择文件
      const res = await wx.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['doc', 'docx']
      })

      const file = res.tempFiles[0]
      
      // 检查文件大小（限制为 10MB）
      if (file.size > 10 * 1024 * 1024) {
        wx.showToast({
          title: '文件过大',
          icon: 'error'
        })
        return
      }

      // 检查文件类型
      const validExtensions = ['.doc', '.docx']
      const fileExtension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
      if (!fileExtension || !validExtensions.includes(fileExtension)) {
        wx.showToast({
          title: '格式不支持',
          icon: 'error'
        })
        return
      }

      wx.showLoading({ title: '上传中...' })

      // 上传到云存储
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: `word/${Date.now()}-${file.name}`,
        filePath: file.path
      })

      // 保存模板信息到数据库
      const db = wx.cloud.database()
      await db.collection('templates').add({
        data: {
          name: file.name.replace(/\.(doc|docx)$/, ''),
          fileID: uploadRes.fileID,
          createTime: db.serverDate()
        }
      })

      wx.showToast({
        title: '上传成功',
        icon: 'success'
      })
      this.loadTemplates()

    } catch (error) {
      console.error('上传Word文档失败:', error)
      wx.showToast({
        title: '上传失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  addTemplate: function() {
    wx.navigateTo({
      url: '/pages/template-create/template-create'
    })
  },

  editTemplate: function(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/template-create/template-create?id=${id}`
    })
  },

  previewTemplate: function(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/template-preview/template-preview?id=${id}`
    })
  },

  deleteTemplate: async function(e) {
    try {
      const id = e.currentTarget.dataset.id
      if (!id) {
        throw new Error('模板ID不能为空')
      }

      const res = await wx.showModal({
        title: '确认删除',
        content: '确定要删除这个模板吗？',
        confirmText: '删除',
        confirmColor: '#ff4d4f'
      })

      if (res.confirm) {
        const db = wx.cloud.database()
        const template = await db.collection('templates').doc(id).get()
        
        // 如果存在文件，先删除云存储中的文件
        if (template.data && template.data.fileID) {
          await wx.cloud.deleteFile({
            fileList: [template.data.fileID]
          })
        }
        
        // 删除数据库记录
        await db.collection('templates').doc(id).remove()
        
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })
        this.loadTemplates()
      }
    } catch (error) {
      console.error('删除模板失败:', error)
      wx.showToast({
        title: error.message || '删除失败',
        icon: 'error'
      })
    }
  }
})
