// pages/sent/sent.js
Page({
  data: {
    status: 'all',
    statusText: '相关',
    contracts: [],
    loading: false
  },

  onLoad() {
    this.loadContracts()
  },

  onShow() {
    this.loadContracts()
  },

  onPullDownRefresh() {
    this.loadContracts()
  },

  async loadContracts() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    try {
      const db = wx.cloud.database()
      const _ = db.command
      
      let query = {
        _openid: '{openid}',
        type: 'sent'
      }

      // 根据状态筛选
      if (this.data.status !== 'all') {
        query.status = this.data.status
      }

      const { data } = await db.collection('contracts')
        .where(query)
        .orderBy('createTime', 'desc')
        .get()

      // 处理状态文本
      const contracts = data.map(item => ({
        ...item,
        statusText: this.getStatusText(item.status),
        createTime: this.formatTime(item.createTime),
        signTime: item.signTime ? this.formatTime(item.signTime) : ''
      }))

      this.setData({ contracts })
    } catch (err) {
      console.error('加载合同列表失败：', err)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    }
  },

  switchStatus(e) {
    const status = e.currentTarget.dataset.status
    const statusTextMap = {
      all: '相关',
      pending: '待签署',
      signed: '已签署',
      rejected: '已拒绝'
    }
    
    this.setData({
      status,
      statusText: statusTextMap[status]
    }, () => {
      this.loadContracts()
    })
  },

  viewContract(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/contract-detail/contract-detail?id=${id}`
    })
  },

  async downloadContract(e) {
    const id = e.currentTarget.dataset.id
    const contract = this.data.contracts.find(item => item._id === id)
    
    if (!contract || !contract.fileID) {
      wx.showToast({
        title: '文件不存在',
        icon: 'error'
      })
      return
    }

    wx.showLoading({
      title: '下载中...'
    })

    try {
      const { tempFilePath } = await wx.cloud.downloadFile({
        fileID: contract.fileID
      })

      await wx.openDocument({
        filePath: tempFilePath,
        showMenu: true
      })
    } catch (err) {
      console.error('下载文件失败：', err)
      wx.showToast({
        title: '下载失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  createContract() {
    wx.navigateTo({
      url: '/pages/template-edit/template-edit'
    })
  },

  onShareAppMessage(e) {
    if (e.from === 'button') {
      const id = e.target.dataset.id
      const contract = this.data.contracts.find(item => item._id === id)
      
      return {
        title: `请查看并签署合同：${contract.fileName}`,
        path: `/pages/contract-detail/contract-detail?id=${id}&share=true`
      }
    }
    return {
      title: '电子合同签署'
    }
  },

  getStatusText(status) {
    const statusMap = {
      pending: '待签署',
      signed: '已签署',
      rejected: '已拒绝'
    }
    return statusMap[status] || '未知状态'
  },

  formatTime(timestamp) {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    
    return `${year}-${month}-${day} ${hour}:${minute}`
  }
})