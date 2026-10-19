// 1. 初始化 Bmob
const Bmob = window.Bmob;
Bmob.initialize("25f0a6a93ff462d9", "167349"); 

// 2. 封装 API
const DB = {
  // 注册新用户
  async register(email, password, username) {
    try {
      // 👇 查重：用户名查一遍，邮箱也查一遍
      try {
        const checkQuery = Bmob.Query('Users');
        checkQuery.equalTo("username", "==", username); 
        const checkRes = await checkQuery.find();
        if (checkRes.length > 0) return { success: false, msg: '该用户名已被注册啦' };

        const checkEmail = Bmob.Query('Users');
        checkEmail.equalTo("email", "==", email); 
        const checkEmailRes = await checkEmail.find();
        if (checkEmailRes.length > 0) return { success: false, msg: '该邮箱已被注册啦' };
      } catch (checkError) {
        console.log("首次使用，自动跳过查重");
      }

      // 写入数据
      const newUser = Bmob.Query('Users');
      newUser.set("username", username);
      newUser.set("password", password);
      newUser.set("email", email);
      newUser.set("avatar", "👤");
      
      const res = await newUser.save();
      return { success: true, user: { id: res.objectId || res.id, username: username } };
    } catch (e) {
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
        // 兼容新版直接返回 JSON 对象的情况
        const user = results[0];
        const uname = user.username || (user.get ? user.get('username') : '云端用户');
        return { success: true, user: { username: uname } };
      }
      return { success: false, msg: '邮箱或密码错误' };
    } catch (e) {
      return { success: false, msg: e.message || '登录失败' };
    }
  },
  
  // 搜索其他用户（保留）
  async searchUser(keyword) {
    try {
      const query = Bmob.Query('Users');
      const results = await query.find();
      const userList = results.map(item => ({
        username: item.username || (item.get ? item.get('username') : ''),
        avatar: item.avatar || (item.get ? item.get('avatar') : '👤') || '👤'
      }));
      return userList.filter(u => u.username && u.username.includes(keyword));
    } catch (e) {
      console.error('搜索报错详情:', e);
      return [];
    }
  }
};
