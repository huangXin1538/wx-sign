// pages/contracts/contracts.js
const app = getApp()

Page({
  data: {
    recentContracts: []
  },

  onLoad() {
    this.loadRecentContracts()
  },

  onShow() {
    this.loadRecentContracts()
  },

  async loadRecentContracts() {
    try {
      const db = wx.cloud.database()
      const _ = db.command
      
      // 获取我发起的和需要我签署的合同
      const [sentRes, receivedRes] = await Promise.all([
        db.collection('contracts')
          .where({
            _openid: '{openid}',
            type: 'sent'
          })
          .orderBy('createTime', 'desc')
          .limit(5)
          .get(),
          
        db.collection('contracts')
          .where({
            signerOpenId: '{openid}',
            type: 'received'
          })
          .orderBy('createTime', 'desc')
          .limit(5)
          .get()
      ])

      // 合并并按时间排序
      const allContracts = [...sentRes.data, ...receivedRes.data]
        .sort((a, b) => b.createTime - a.createTime)
        .slice(0, 5)
        .map(contract => ({
          ...contract,
          statusText: this.getStatusText(contract.status),
          counterpartyName: contract.type === 'sent' ? contract.signerName : contract.senderName,
          createTime: this.formatTime(contract.createTime)
        }))

      this.setData({
        recentContracts: allContracts
      })
    } catch (err) {
      console.error('加载最近合同失败：', err)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  },

  navigateToTemplates() {
    wx.navigateTo({
      url: '/pages/template-edit/template-edit'
    })
  },

  navigateToSent() {
    wx.navigateTo({
      url: '/pages/sent/sent'
    })
  },

  navigateToReceived() {
    wx.navigateTo({
      url: '/pages/received/received'
    })
  },

  viewContract(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/sign/sign?id=${id}`
    })
  },

  viewMore() {
    wx.showActionSheet({
      itemList: ['我发起的', '我签署的'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.navigateToSent()
        } else {
          this.navigateToReceived()
        }
      }
    })
  },

  getStatusText(status) {
    const statusMap = {
      'pending': '待签署',
      'signed': '已签署',
      'rejected': '已拒绝'
    }
    return statusMap[status] || status
  },

  formatTime(timestamp) {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
})