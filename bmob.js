const Bmob = window.Bmob;
Bmob.initialize("7cb2ff0bf8b7c4af565b97ab0783dd39", "155ab422123ce0bd7886426fa9834a30");

const DB = {
  async register(email, password, username) {
    try {
      const checkQuery = Bmob.Query('Users');
      checkQuery.equalTo("username", username); 
      const checkRes = await checkQuery.find();
      
      if (checkRes.length > 0) {
        return { success: false, msg: '该用户名已被注册啦' };
      }

      const newUser = Bmob.Object.extend("Users");
      const user = new newUser();
      user.set("username", username);
      user.set("password", password);
      user.set("email", email);
      user.set("avatar", "👤");
      
      const res = await user.save();
      return { success: true, user: { id: res.id, username: username } };
    } catch (e) {
      console.error("注册报错详情:", e);
      return { success: false, msg: e.message || '注册失败' };
    }
  },

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

  async searchUser(keyword) {
    try {
      const query = Bmob.Query('Users');
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
