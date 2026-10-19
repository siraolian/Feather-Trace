/* ============================================================
 * Feather Trace —— 本地存储层（离线核心）
 * 所有用户数据（收藏鸟种、帖子、点赞、成就、个人信息）
 * 都保存在浏览器 localStorage 中，无需服务器即可完整运行。
 * 若浏览器禁用存储，自动降级为内存模式（刷新后重置）。
 * ============================================================ */

const Store = (() => {
  let mem = {};
  let useLS = true;
  try {
    localStorage.setItem('__ft_test__', '1');
    localStorage.removeItem('__ft_test__');
  } catch (e) {
    useLS = false;
  }

  function read(key, def) {
    try {
      if (useLS) {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : def;
      }
      return (key in mem) ? mem[key] : def;
    } catch (e) { return def; }
  }
  function write(key, val) {
    try {
      if (useLS) localStorage.setItem(key, JSON.stringify(val));
      else mem[key] = JSON.parse(JSON.stringify(val));
    } catch (e) { /* 存储已满或不可用，静默 */ }
  }

  /* 默认初始状态 */
  const DEFAULTS = {
    ft_user: {
      name: '观鸟新手', avatar: '🦜', code: 'FT-' + Math.floor(100000 + Math.random() * 900000),
      level: 3, exp: 260, likesReceived: 65, fish: 30, isVip: false
    },
    ft_birds: [],          // 已收录鸟种 id 列表
    ft_posts: SEED_POSTS,  // 帖子（种子 + 用户新发）
    ft_myPosts: [],        // 我发布的帖子 id
    ft_liked: [],          // 我点赞过的帖子 id
    ft_fished: [],         // 我打赏过的帖子 id
    ft_spotSaved: [],
    ft_saved_posts: [],
    ft_history: [],
    ft_following: ['鸟导阿强', '镜头里的风'], // 默认关注了这两个
    ft_followers: ['东湖漫游者', '望江楼老周'],
    ft_custom_birds: [],
    ft_chat_records: {}
  };

  const api = {
    get(key) { return read(key, DEFAULTS[key]); },
    set(key, val) { write(key, val); },
    user() { return api.get('ft_user'); },
    saveUser(u) { api.set('ft_user', u); },
    birds() { return api.get('ft_birds'); },
    saveBirds(list) { api.set('ft_birds', list); },
    posts() { return api.get('ft_posts'); },
    savePosts(list) { api.set('ft_posts', list); },
    myPosts() { return api.get('ft_myPosts'); },
    saveMyPosts(list) { api.set('ft_myPosts', list); },
    liked() { return api.get('ft_liked'); },
    saveLiked(list) { api.set('ft_liked', list); },
    fished() { return api.get('ft_fished'); },
    saveFished(list) { api.set('ft_fished', list); },
    spotSaved() { return api.get('ft_spotSaved'); },
    saveSpotSaved(list) { api.set('ft_spotSaved', list); },
    savedPosts() { return api.get('ft_saved_posts'); },
    savePostsSaved(list) { api.set('ft_saved_posts', list); },
    history() { return api.get('ft_history'); },
    saveHistory(list) { api.set('ft_history', list); },
    following() { return api.get('ft_following'); }, 
    saveFollowing(list) { api.set('ft_following', list); }, 
    followers() { return api.get('ft_followers'); },        
    saveFollowers(list) { api.set('ft_followers', list); },
    customBirds() { return api.get('ft_custom_birds'); },
    saveCustomBirds(list) { api.set('ft_custom_birds', list); },
    chatRecords() { return api.get('ft_chat_records'); },
    saveChatRecords(obj) { api.set('ft_chat_records', obj); } 
  };
  return api;
})();
