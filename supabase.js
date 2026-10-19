// 使用 CDN 方式时，Supabase 挂载在全局 window.supabase 上
const { createClient } = supabase; 

const supabaseUrl = 'https://alegliwrqcuzmfhzqpid.supabase.co/rest/v1/';
const supabaseKey = 'sb_publishable_j4bCFpKEFMoqtSNaUE0S5Q_RZ1D0wLo';

// 创建客户端实例
const supabaseClient = createClient(supabaseUrl, supabaseKey);
