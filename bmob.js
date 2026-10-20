// 1. 初始化 Bmob
const Bmob = window.Bmob;
Bmob.initialize("25f0a6a93ff462d9", "167349"); 

// 2. 封装 API
const DB = {
  // 注册
  async register(email, password, username) {
    try {
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
        const user = results[0];
        const uname = user.username || (user.get ? user.get('username') : '云端用户');
        return { success: true, user: { username: uname } };
      }
      return { success: false, msg: '邮箱或密码错误' };
    } catch (e) {
      return { success: false, msg: e.message || '登录失败' };
    }
  },
  
  // 搜索用户
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
  },

  // 发送消息
  async sendMsg(sender, receiver, text) {
    try {
      const newMsg = Bmob.Query('Messages');
      newMsg.set("sender", sender);
      newMsg.set("receiver", receiver);
      newMsg.set("text", text);
      const res = await newMsg.save();
      return res; 
    } catch (e) {
      console.error("发送失败", e);
      return null;
    }
  }, // 👈 就是这里！这次有逗号了！

  // 获取聊天记录
  async getMsgs(userA, userB) {
    try {
      const [res1, res2] = await Promise.all([
        (async () => {
          const q = Bmob.Query('Messages');
          q.equalTo("sender", "==", userA);
          q.equalTo("receiver", "==", userB);
          return await q.find();
        })(),
        (async () => {
          const q = Bmob.Query('Messages');
          q.equalTo("sender", "==", userB);
          q.equalTo("receiver", "==", userA);
          return await q.find();
        })()
      ]);

      let allMsgs = [...res1, ...res2];
      return allMsgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); 
    } catch (e) {
      console.error("获取记录失败", e);
      return [];
    }
  },

    // 👇 新增：获取我的所有聊天联系人（用于渲染信息列表）
  async getChatSessions(myName) {
    try {
      const query = Bmob.Query('Messages');
      // 找出所有发给我的消息
      query.equalTo("receiver", "==", myName);
      query.order("-createdAt"); // 按时间倒序
      query.limit(100); // 只取最近100条
      const results = await query.find();
      
      // 提取出不同的发送者
      let senders = [];
      let sessions = [];
      results.forEach(msg => {
        const sender = msg.sender;
        if (!senders.includes(sender)) {
          senders.push(sender);
          sessions.push({
            name: sender,
            text: msg.text,
            time: msg.createdAt ? msg.createdAt.slice(11, 16) : '刚刚' // 截取时间
          });
        }
      });
      return sessions;
    } catch (e) {
      console.error("获取列表失败", e);
      return [];
    }
  },

  // 👇 新增：检查是否有新消息（用于亮红点）
  async checkUnread(myName, lastCheckTime) {
    try {
      const query = Bmob.Query('Messages');
      query.equalTo("receiver", "==", myName);
      // 查大于上次查看时间的消息
      query.limit(10);
      const results = await query.find();
       // 只要有一条消息的创建时间晚于上次查看时间，就算有新消息
      return results.some(msg => msg.createdAt > lastCheckTime);
    } catch (e) {
      console.error("检查未读失败", e);
      return false;
    }
  }
};
