// 云函数入口文件
const cloud = require('wx-server-sdk')
const mammoth = require('mammoth')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { fileID } = event
    
    if (!fileID) {
      return {
        success: false,
        error: '未提供文件ID'
      }
    }

    console.log('开始下载文件:', fileID)

    // 下载云存储中的文件
    const res = await cloud.downloadFile({
      fileID: fileID,
    })
    
    if (!res.fileContent) {
      console.error('文件下载失败:', res)
      throw new Error('文件下载失败')
    }

    console.log('文件下载成功，开始解析')

    // 使用 mammoth 解析 Word 文档
    const result = await mammoth.convertToHtml({ 
      buffer: res.fileContent,
      options: {
        styleMap: [
          "p[style-name='标题 1'] => h1:fresh",
          "p[style-name='标题 2'] => h2:fresh",
          "p[style-name='标题 3'] => h3:fresh",
          "p => p:fresh"
        ],
        includeDefaultStyleMap: true,
        convertImage: mammoth.images.imgElement(function(image) {
          return image.read().then(function(imageBuffer) {
            // 将图片转换为 base64
            return {
              src: `data:${image.contentType};base64,${imageBuffer.toString('base64')}`
            };
          });
        })
      }
    })
    
    if (!result || !result.value) {
      console.error('文档解析失败:', result)
      throw new Error('文档解析失败')
    }

    console.log('文档解析成功')

    // 处理解析后的HTML内容
    let html = result.value
    
    // 确保段落正确换行
    html = html.replace(/><p/g, '>\n<p')
    html = html.replace(/><h(\d)/g, '>\n<h$1')
    
    // 移除多余的空行
    html = html.replace(/\n\s*\n/g, '\n')

    console.log('处理后的HTML:', html)

    return {
      success: true,
      data: {
        html: html,
        messages: result.messages
      }
    }
    
  } catch (error) {
    console.error('解析Word文档失败:', error)
    return {
      success: false,
      error: error.message || '解析失败'
    }
  }
}
