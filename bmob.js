// 1. 初始化 Bmob（使用你配置好的 Secret Key 和 API 安全码）
const Bmob = window.Bmob;
Bmob.initialize("25f0a6a93ff462d9", "167349"); 

// 2. 封装 API
const DB = {
  // 注册新用户
  async register(email, password, username) {
    try {
      // 查重（新版语法：必须加 "=="）
      const checkQuery = Bmob.Query('Users');
      checkQuery.equalTo("username", "==", username); 
      const checkRes = await checkQuery.find();
      
      if (checkRes.length > 0) {
        return { success: false, msg: '该用户名已被注册啦' };
      }

      // 写入数据
      const newUser = Bmob.Query('Users');
      newUser.set("username", username);
      newUser.set("password", password);
      newUser.set("email", email);
      newUser.set("avatar", "👤");
      
      const res = await newUser.save();
      return { success: true, user: { id: res.id, username: username } };
    } catch (e) {
      console.error("注册报错详情:", e);
      return { success: false, msg: e.message || '注册失败' };
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
      console.error("登录报错详情:", e);
      return { success: false, msg: e.message || '登录失败' };
    }
  },

  // 搜索用户（模糊搜索）
  async searchUser(keyword) {
    try {
      const query = Bmob.Query('Users');
      // 模糊搜索（也要加 "=="）
      query.equalTo("username", "==", new Bmob.RegExp({ regexp: keyword, options: 'i' }));
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
