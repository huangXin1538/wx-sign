// pages/template-form/template-form.js
const app = getApp()

Page({
  data: {
    id: '',
    template: {
      name: '',
      description: '',
      icon: '',
      preview: '',
      sections: []
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id })
      this.loadTemplate(options.id)
    }
  },

  async loadTemplate(id) {
    const db = wx.cloud.database()
    try {
      const { data } = await db.collection('templates').doc(id).get()
      this.setData({ template: data })
    } catch (error) {
      console.error('加载模板失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  },

  chooseIcon() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.uploadFile(res.tempFilePaths[0], 'icon')
      }
    })
  },

  choosePreview() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.uploadFile(res.tempFilePaths[0], 'preview')
      }
    })
  },

  async uploadFile(filePath, type) {
    wx.showLoading({ title: '上传中...' })
    
    try {
      const cloudPath = `templates/${Date.now()}-${Math.floor(Math.random() * 1000)}${filePath.match(/\.[^.]+?$/)[0]}`
      const { fileID } = await wx.cloud.uploadFile({
        cloudPath,
        filePath
      })
      
      this.setData({
        [`template.${type}`]: fileID
      })
      
      wx.hideLoading()
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('上传失败:', error)
      wx.hideLoading()
      wx.showToast({
        title: '上传失败',
        icon: 'error'
      })
    }
  },

  addSection() {
    const { sections } = this.data.template
    sections.push({ content: '' })
    this.setData({
      'template.sections': sections
    })
  },

  updateSection(e) {
    const { index } = e.currentTarget.dataset
    const { value } = e.detail
    const { sections } = this.data.template
    sections[index].content = value
    this.setData({
      'template.sections': sections
    })
  },

  moveSection(e) {
    const { index, direction } = e.currentTarget.dataset
    const { sections } = this.data.template
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex >= 0 && newIndex < sections.length) {
      const temp = sections[index]
      sections[index] = sections[newIndex]
      sections[newIndex] = temp
      this.setData({
        'template.sections': sections
      })
    }
  },

  deleteSection(e) {
    const { index } = e.currentTarget.dataset
    const { sections } = this.data.template
    sections.splice(index, 1)
    this.setData({
      'template.sections': sections
    })
  },

  async submitForm(e) {
    const { name, description } = e.detail.value
    const { id, template } = this.data
    
    if (!name || !description) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    if (!template.icon || !template.preview) {
      wx.showToast({
        title: '请上传图片',
        icon: 'none'
      })
      return
    }

    if (!template.sections.length) {
      wx.showToast({
        title: '请添加合同条款',
        icon: 'none'
      })
      return
    }

    const db = wx.cloud.database()
    const data = {
      ...template,
      name,
      description,
      updateTime: db.serverDate()
    }

    wx.showLoading({ title: '保存中...' })

    try {
      if (id) {
        await db.collection('templates').doc(id).update({
          data
        })
      } else {
        data.createTime = db.serverDate()
        await db.collection('templates').add({
          data
        })
      }

      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('保存失败:', error)
      wx.hideLoading()
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      })
    }
  }
})
