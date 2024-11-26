const cloud = require('wx-server-sdk')

cloud.init({
  env: 'production-4gejwnfof2bb1ace'
})

exports.main = async (event, context) => {
  const db = cloud.database()
  
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

  // 创建索引
  try {
    await db.collection('contracts').createIndex({
      key: {
        createTime: -1,
        type: 1,
        status: 1
      }
    })
    console.log('创建contracts索引成功')
  } catch (err) {
    console.log('创建contracts索引失败', err)
  }

  try {
    await db.collection('templates').createIndex({
      key: {
        createTime: -1,
        creatorId: 1
      }
    })
    console.log('创建templates索引成功')
  } catch (err) {
    console.log('创建templates索引失败', err)
  }

  return {
    success: true,
    message: '数据库初始化完成'
  }
}
