App({
  globalData: {
    userInfo: null,
    contracts: []
  },
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'production-4gejwnfof2bb1ace', // 你的云开发环境ID
        traceUser: true
      })
      
      // 调用云函数初始化数据库
      this.initDatabaseWithCloud()
    }
  },

  async initDatabaseWithCloud() {
    const maxRetries = 3 // 最大重试次数
    let retryCount = 0
    
    while (retryCount < maxRetries) {
      try {
        const result = await wx.cloud.callFunction({
          name: 'init'
        })
        console.log('数据库初始化结果：', result)
        break
      } catch (err) {
        console.error(`数据库初始化失败(第${retryCount + 1}次尝试)：`, err)
        retryCount++
        
        if (retryCount === maxRetries) {
          console.error('数据库初始化失败，尝试直接创建集合')
          this.initDatabaseDirectly()
        } else {
          // 等待一秒后重试
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }
  },

  async initDatabaseDirectly() {
    const db = wx.cloud.database()
    
    try {
      // 创建合同集合
      await db.createCollection('contracts')
      console.log('创建contracts集合成功')
    } catch (err) {
      console.log('contracts集合已存在或创建失败', err)
    }

    try {
      // 创建模板集合
      await db.createCollection('templates')
      console.log('创建templates集合成功')
    } catch (err) {
      console.log('templates集合已存在或创建失败', err)
    }

    try {
      // 创建用户集合
      await db.createCollection('users')
      console.log('创建users集合成功')
    } catch (err) {
      console.log('users集合已存在或创建失败', err)
    }
  }
})
