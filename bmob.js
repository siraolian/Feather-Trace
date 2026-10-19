// 1. 初始化 Bmob
const Bmob = window.Bmob;
Bmob.initialize("7cb2ff0bf8b7c4af565b97ab0783dd39", "90bacd3d4d8f20691f6e273c903f5a97");

// 2. 封装给前台调用的 API（对外接口与之前完全保持一致）
const DB = {
  // 注册新用户
  async register(email, password, username) {
    try {
      // 1. 注册系统用户表 _User
      let user = new Bmob.User();
      user.set("username", username);
      user.set("password", password);
      user.set("email", email);
      // Bmob 默认会给用户加 ACL 权限，只有自己能读写
      let res = await user.signUp();

      // 2. 将用户信息存入公开的 Profile 表（用于别人能搜到你）
      let Profile = Bmob.Object.extend("Profile");
      let profile = new Profile();
      profile.set("username", username);
      profile.set("avatar", "🦜");
      profile.set("userId", res.id);
      
      // 设置 Profile 表公开可读，否则搜不到
      let acl = new Bmob.ACL();
      acl.setPublicReadAccess(true);
      acl.setWriteAccess(res.id, true); // 只有自己可以改
      profile.setACL(acl);

      await profile.save();
      return { success: true, user: res };
    } catch (e) {
      return { success: false, msg: e.message };
    }
  },

  // 登录
  async login(email, password) {
    try {
      const user = await Bmob.User.logIn(email, password);
      return { success: true, user: user };
    } catch (e) {
      return { success: false, msg: e.message };
    }
  },

  // 搜索其他用户（关键功能！）
  async searchUser(keyword) {
    try {
      const query = Bmob.Query("Profile");
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
