// 使用 CDN 方式时，Supabase 挂载在全局 window.supabase 上
const { createClient } = supabase; 

const supabaseUrl = 'https://alegliwrqcuzmfhzqpid.supabase.co/rest/v1/';
const supabaseKey = 'sb_publishable_j4bCFpKEFMoqtSNaUE0S5Q_RZ1D0wLo';

// 创建客户端实例
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// 2. 封装给前台调用的 API
const DB = {
  // 注册新用户
  async register(email, password, username) {
    // 注册 Auth 账号
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) return { success: false, msg: error.message };

    // 将用户名存入 profiles 表
    if (data.user) {
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert([{ id: data.user.id, username: username }]);
      
      if (profileError) return { success: false, msg: profileError.message };
      return { success: true, user: data.user };
    }
    return { success: false, msg: '未知错误' };
  },

  // 登录
  async login(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return { success: false, msg: error.message };
    return { success: true, user: data.user };
  },

  // 搜索其他用户（关键功能！）
  async searchUser(keyword) {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('username, avatar')
      .ilike('username', `%${keyword}%`); // 模糊搜索
      
    if (error) {
      console.error('搜索失败:', error.message);
      return [];
    }
    return data;
  }
}
