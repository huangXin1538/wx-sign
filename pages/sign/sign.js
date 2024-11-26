// pages/sign/sign.js
const app = getApp()
const CANVAS_WIDTH = 700
const CANVAS_HEIGHT = 600

Page({
  data: {
    contractId: '',
    contractTitle: '',
    contractNo: '',
    createTime: '',
    statusClass: 'pending',
    statusText: '待签署',
    contractContent: '',
    loading: true,
    error: false,
    errorMessage: '',
    showSignature: false,
    canSubmit: false
  },

  onLoad(options) {
    console.log('Sign page loaded with options:', options)
    if (options.id) {
      this.setData({ contractId: options.id })
      this.loadContractDetails()
    } else {
      this.setData({
        loading: false,
        error: true,
        errorMessage: '未找到合同信息'
      })
    }
  },

  async loadContractDetails() {
    try {
      console.log('Loading contract details for ID:', this.data.contractId)
      const db = wx.cloud.database()
      const contract = await db.collection('contracts').doc(this.data.contractId).get()
      
      if (!contract.data) {
        throw new Error('合同不存在')
      }

      console.log('Contract data retrieved:', contract.data)
      
      this.setData({
        contractTitle: contract.data.title || '未命名合同',
        contractNo: contract.data.contractNo || '未分配',
        createTime: this.formatDate(contract.data.createTime),
        loading: true
      })

      await this.loadContractContent(contract.data.fileID)
    } catch (error) {
      console.error('Failed to load contract details:', error)
      this.setData({
        loading: false,
        error: true,
        errorMessage: '加载合同详情失败'
      })
    }
  },

  async loadContractContent(fileID) {
    try {
      console.log('Loading contract content for fileID:', fileID)
      
      // 获取文件信息
      const { fileList } = await wx.cloud.getTempFileURL({
        fileList: [fileID]
      })
      
      if (!fileList || !fileList[0] || !fileList[0].tempFileURL) {
        throw new Error('获取文件链接失败')
      }

      const fileName = fileID.split('/').pop()
      const fileType = this.getFileType(fileName)
      console.log('Detected file type:', fileType)

      // 调用云函数进行文档转换
      const { result } = await wx.cloud.callFunction({
        name: 'convertDocument',
        data: {
          fileID,
          fileType
        }
      })

      if (!result || !result.content) {
        throw new Error('文档转换失败')
      }

      console.log('Document conversion successful')
      
      this.setData({
        contractContent: result.content,
        loading: false,
        error: false
      })
    } catch (error) {
      console.error('Failed to load contract content:', error)
      this.setData({
        loading: false,
        error: true,
        errorMessage: '加载合同内容失败'
      })
    }
  },

  getFileType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase()
    console.log('File extension:', ext)
    return ext
  },

  formatDate(timestamp) {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  },

  async onReady() {
    try {
      const query = wx.createSelectorQuery()
      query.select('#signatureCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0]) {
            const canvas = res[0].node
            const ctx = canvas.getContext('2d')
            
            // 获取设备像素比
            const dpr = wx.getSystemInfoSync().pixelRatio
            
            // 设置画布的实际渲染大小
            canvas.width = res[0].width * dpr
            canvas.height = res[0].height * dpr
            
            // 缩放画布上下文以适应设备像素比
            ctx.scale(dpr, dpr)
            
            // 存储canvas和上下文引用
            this.canvas = canvas
            this.ctx = ctx
            
            // 设置画布样式
            ctx.strokeStyle = '#000000'
            ctx.lineWidth = 3
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            
            console.log('Canvas initialized:', {
              width: canvas.width,
              height: canvas.height,
              dpr: dpr
            })
          } else {
            console.error('Failed to get canvas node')
          }
        })
    } catch (error) {
      console.error('Canvas initialization error:', error)
    }
  },

  toggleSignature() {
    const showSignature = !this.data.showSignature
    this.setData({ showSignature })
    
    if (!showSignature) {
      this.clearSignature()
    }
  },

  handleTouchStart(e) {
    const touch = e.touches[0]
    const rect = this.canvas.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    
    this.ctx.beginPath()
    this.ctx.moveTo(x, y)
    this.lastX = x
    this.lastY = y
    this.hasDraw = false
  },

  handleTouchMove(e) {
    const touch = e.touches[0]
    const rect = this.canvas.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    
    this.ctx.beginPath()
    this.ctx.moveTo(this.lastX, this.lastY)
    this.ctx.lineTo(x, y)
    this.ctx.stroke()
    
    this.lastX = x
    this.lastY = y
    this.hasDraw = true
  },

  handleTouchEnd() {
    if (this.hasDraw) {
      this.setData({ canSubmit: true })
    }
  },

  clearSignature() {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.setData({ canSubmit: false })
    }
  },

  async confirmSignature() {
    if (!this.hasDraw) {
      wx.showToast({
        title: '请先签名',
        icon: 'none'
      })
      return
    }

    try {
      wx.showLoading({ title: '保存签名中' })
      
      // 获取画布内容
      const { tempFilePath } = await wx.canvasToTempFilePath({
        canvas: this.canvas,
        fileType: 'png'
      })

      // 上传签名图片
      const { fileID } = await wx.cloud.uploadFile({
        cloudPath: `signatures/${this.data.contractId}_${Date.now()}.png`,
        filePath: tempFilePath
      })

      // 更新合同状态
      const db = wx.cloud.database()
      await db.collection('contracts').doc(this.data.contractId).update({
        data: {
          status: 'signed',
          signatureFileID: fileID,
          signedTime: db.serverDate()
        }
      })

      wx.hideLoading()
      wx.showToast({
        title: '签名已保存',
        icon: 'success'
      })

      // 更新页面状态
      this.setData({
        showSignature: false,
        statusClass: 'signed',
        statusText: '已签署'
      })

    } catch (error) {
      console.error('Failed to save signature:', error)
      wx.hideLoading()
      wx.showToast({
        title: '保存签名失败',
        icon: 'none'
      })
    }
  },

  async submitContract() {
    if (!this.data.canSubmit) {
      wx.showToast({
        title: '请先完成签名',
        icon: 'none'
      })
      return
    }

    try {
      wx.showLoading({ title: '提交合同中' })
      
      // TODO: 实现合同提交逻辑
      
      wx.hideLoading()
      wx.showToast({
        title: '提交成功',
        icon: 'success'
      })

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)

    } catch (error) {
      console.error('Failed to submit contract:', error)
      wx.hideLoading()
      wx.showToast({
        title: '提交失败',
        icon: 'none'
      })
    }
  }
})