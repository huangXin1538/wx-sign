// 云函数入口文件
const cloud = require('wx-server-sdk')
const mammoth = require('mammoth')
const fs = require('fs')
const path = require('path')
const os = require('os')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 云函数入口函数
exports.main = async (event, context) => {
  const { fileID, fileName } = event
  
  if (!fileID) {
    throw new Error('文件ID不能为空')
  }

  try {
    // 下载文件
    console.log('开始下载文件:', fileID)
    const res = await cloud.downloadFile({
      fileID: fileID
    })

    // 创建临时文件路径
    const tempDir = os.tmpdir()
    const tempFilePath = path.join(tempDir, `${Date.now()}.docx`)
    
    // 将文件内容写入临时文件
    console.log('写入临时文件:', tempFilePath)
    fs.writeFileSync(tempFilePath, res.fileContent)

    // 使用mammoth转换docx为html
    console.log('开始转换文件')
    const result = await mammoth.convertToHtml({ path: tempFilePath })
    
    // 清理临时文件
    try {
      fs.unlinkSync(tempFilePath)
    } catch (err) {
      console.error('清理临时文件失败:', err)
    }

    // 返回转换后的文本内容
    return {
      success: true,
      content: result.value,
      messages: result.messages
    }
  } catch (err) {
    console.error('转换文件失败:', err)
    return {
      success: false,
      error: err.message
    }
  }
}
