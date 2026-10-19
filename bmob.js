// 1. 初始化 Bmob
const Bmob = window.Bmob;
Bmob.initialize("7cb2ff0bf8b7c4af565b97ab0783dd39", "155ab422123ce0bd7886426fa9834a30");

// 2. 封装 API
const DB = {
  // 注册新用户
  async register(email, password, username) {
    try {
      // 👇 第一步：查重
      const checkQuery = Bmob.Query('Users');
      // 正确的写法：不需要中间的 "=="，直接写要匹配的值
      checkQuery.equalTo("username", username); 
      const checkRes = await checkQuery.find();
      
      if (checkRes.length > 0) {
        return { success: false, msg: '该用户名已被注册啦' };
      }

      // 👇 第二步：如果不重复，则写入数据库
      const query = Bmob.Query('Users');
      query.set('username', username);
      query.set('password', password);
      query.set('email', email);
      query.set('avatar', '👤');
      
      // 开启公开读写权限
      const acl = new Bmob.ACL();
      acl.setPublicReadAccess(true);
      acl.setPublicWriteAccess(true); 
      query.setACL(acl);

      const res = await query.save();
      return { success: true, user: { id: res.id, username: username } };
    } catch (e) {
      console.error("注册报错详情:", e);
      // 如果查重报错（比如表不存在），我们依然放行，强行插入
      try {
        const query = Bmob.Query('Users');
        query.set('username', username);
        query.set('password', password);
        query.set('email', email);
        query.set('avatar', '👤');
        const acl = new Bmob.ACL();
        acl.setPublicReadAccess(true);
        acl.setPublicWriteAccess(true); 
        query.setACL(acl);
        const res = await query.save();
        return { success: true, user: { id: res.id, username: username } };
      } catch (err) {
        return { success: false, msg: '注册失败，请检查网络' };
      }
    }
  },

  // 登录
  async login(email, password) {
    try {
      const query = Bmob.Query('Users');
      query.equalTo("email", email); 
      query.equalTo("password", password);
      const results = await query.find();
      
      if (results.length > 0) {
        return { success: true, user: results[0] };
      }
      return { success: false, msg: '邮箱或密码错误' };
    } catch (e) {
      console.error("登录报错详情:", e);
      return { success: false, msg: e.message || '登录失败' };
    }
  },

  // 搜索其他用户（支持模糊搜索）
  async searchUser(keyword) {
    try {
      const query = Bmob.Query('Users');
      // 正确用法：正则表达式模糊匹配
      query.equalTo("username", new Bmob.RegExp({ regexp: keyword, options: 'i' }));
      
      const results = await query.find();
      return results.map(item => ({
        username: item.get('username'),
        avatar: item.get('avatar') || '👤'
      }));
    } catch (e) {
      console.error('搜索报错详情:', e);
      return [];
    }
  }
};
