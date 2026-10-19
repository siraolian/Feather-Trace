// 1. 初始化 Bmob
const Bmob = window.Bmob;
// 注意：这里用的还是你刚才成功连上的那套配置
Bmob.initialize("7cb2ff0bf8b7c4af565b97ab0783dd39", "155ab422123ce0bd7886426fa9834a30");

// 2. 封装 API（改用普通的 Users 表，绕过官方认证系统）
const DB = {
  // 注册新用户
  async register(email, password, username) {
    try {
      // 先检查用户名是否重复
      const checkQuery = Bmob.Query('Users');
      checkQuery.equalTo("username", "==", username);
      const count = await checkQuery.count();
      if (count > 0) return { success: false, msg: '该用户名已被注册' };

      // 创建新用户
      const query = Bmob.Query('Users');
      query.set('username', username);
      query.set('password', password);
      query.set('email', email);
      query.set('avatar', '👤');
      
      // 关键：为了能跨设备搜索，必须开启公开读写权限
      const acl = new Bmob.ACL();
      acl.setPublicReadAccess(true);
      acl.setPublicWriteAccess(true); 
      query.setACL(acl);

      const res = await query.save();
      return { success: true, user: { id: res.id, username: username } };
    } catch (e) {
      return { success: false, msg: e.message };
    }
  },

  // 登录
  async login(email, password) {
    try {
      const query = Bmob.Query('Users');
      query.equalTo("email", "==", email);
      query.equalTo("password", "==", password);
      const results = await query.find();
      
      if (results.length > 0) {
        return { success: true, user: results[0] };
      }
      return { success: false, msg: '邮箱或密码错误' };
    } catch (e) {
      return { success: false, msg: e.message };
    }
  },

  // 搜索其他用户（支持模糊搜索）
  async searchUser(keyword) {
    try {
      const query = Bmob.Query('Users');
      // 使用正则表达式实现模糊搜索
      query.equalTo("username", new Bmob.RegExp({ regexp: keyword, options: 'i' }));
      
      const results = await query.find();
      return results.map(item => ({
        username: item.get('username'),
        avatar: item.get('avatar') || '👤'
      }));
    } catch (e) {
      console.error('搜索失败:', e.message);
      return [];
    }
  }
};
