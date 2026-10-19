// 1. 初始化 Bmob
const Bmob = window.Bmob;
// 注意：这里的 155ab... 是你之前发给我的 REST API Key
Bmob.initialize("25f0a6a93ff462d9", "167349");

// 2. 封装 API
const DB = {
  // 注册新用户
  async register(email, password, username) {
    try {
      // 第一步：查重
      const checkQuery = Bmob.Query('Users');
      checkQuery.equalTo("username", username); 
      const checkRes = await checkQuery.find();
      
      if (checkRes.length > 0) {
        return { success: false, msg: '该用户名已被注册啦' };
      }

      // 第二步：写入数据（新版强制使用 Bmob.Query 的 save 方法）
      const newQuery = Bmob.Query('Users');
      newQuery.set("username", username);
      newQuery.set("password", password);
      newQuery.set("email", email);
      newQuery.set("avatar", "👤");
      
      const res = await newQuery.save();
      
      // 返回成功
      return { success: true, user: { id: res.objectId, username: username } };
    } catch (e) {
      console.error("注册报错详情:", e);
      return { success: false, msg: e.message || '注册失败' };
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

  // 搜索其他用户
  async searchUser(keyword) {
    try {
      const query = Bmob.Query('Users');
      // 模糊搜索
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
