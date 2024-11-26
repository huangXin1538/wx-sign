const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const db = cloud.database()
  const _ = db.command
  
  try {
    // 创建测试合同记录
    const result = await db.collection('contracts').add({
      data: {
        fileID: 'cloud://xxx/test.docx', // 这里需要替换为实际上传的文件ID
        fileName: '测试合同.docx',
        status: 'pending',
        createTime: db.serverDate(),
        creatorId: event.userInfo.openId
      }
    })
    
    return {
      success: true,
      contractId: result._id
    }
    
  } catch (err) {
    console.error(err)
    return {
      success: false,
      error: err
    }
  }
}
