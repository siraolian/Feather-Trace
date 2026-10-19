// 1. 初始化 Bmob（使用你配置好的 Secret Key 和 API 安全码）
const Bmob = window.Bmob;
Bmob.initialize("25f0a6a93ff462d9", "167349"); 

// 2. 封装 API
const DB = {
  // 注册新用户
  async register(email, password, username) {
    try {
      // 👇 保护性查重：如果表不存在，查重会报错，我们捕获错误并忽略
      try {
        const checkQuery = Bmob.Query('Users');
        checkQuery.equalTo("username", "==", username); 
        const checkRes = await checkQuery.find();
        
        if (checkRes.length > 0) {
          return { success: false, msg: '该用户名已被注册啦' };
        }
      } catch (checkError) {
        // 如果报错说 object not found，说明第一次用，直接放行
        console.log("首次使用，自动跳过查重并建表");
      }

      // 👇 强行写入数据（只要运行到这里，就会自动在 Bmob 后台建出 Users 表）
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
  
  // 搜索其他用户（支持模糊搜索）
  async searchUser(keyword) {
    try {
      const query = Bmob.Query('Users');
      // 👇 使用标准正则对象进行模糊搜索，兼容性最好
      query.equalTo("username", {
        "$regex": keyword,
        "$options": "i" // i 代表忽略大小写
      });
      
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
