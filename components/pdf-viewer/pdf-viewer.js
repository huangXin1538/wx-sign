Component({
  properties: {
    src: {
      type: String,
      value: '',
      observer: function(newVal) {
        if (newVal) {
          this.loadPDF(newVal)
        }
      }
    }
  },

  data: {
    pages: [],
    currentPage: 1,
    totalPages: 0,
    scale: 1,
    loading: false,
    error: null
  },

  methods: {
    async loadPDF(filePath) {
      this.setData({ loading: true, error: null })
      try {
        // 这里使用小程序的文件系统API读取PDF
        const fs = wx.getFileSystemManager()
        const fileInfo = await new Promise((resolve, reject) => {
          fs.getFileInfo({
            filePath,
            success: resolve,
            fail: reject
          })
        })

        if (fileInfo.size === 0) {
          throw new Error('PDF文件为空')
        }

        // 在实际应用中，这里需要实现PDF解析和渲染
        // 由于小程序限制，可能需要后端服务来处理PDF
        // 这里仅做示例，将PDF显示为图片
        this.setData({
          pages: [filePath],
          totalPages: 1,
          currentPage: 1,
          loading: false
        })
      } catch (err) {
        console.error('加载PDF失败：', err)
        this.setData({
          loading: false,
          error: '加载PDF失败'
        })
      }
    },

    prevPage() {
      if (this.data.currentPage > 1) {
        this.setData({
          currentPage: this.data.currentPage - 1
        })
      }
    },

    nextPage() {
      if (this.data.currentPage < this.data.totalPages) {
        this.setData({
          currentPage: this.data.currentPage + 1
        })
      }
    },

    zoomIn() {
      this.setData({
        scale: Math.min(2, this.data.scale + 0.1)
      })
    },

    zoomOut() {
      this.setData({
        scale: Math.max(0.5, this.data.scale - 0.1)
      })
    },

    onPageTap() {
      // 可以在这里实现点击页面时的交互
    }
  }
})
