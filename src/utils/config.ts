/**
 * 全局配置
 * MODE = 'mock' | 'api' | 'deepseek'
 *  - mock     ：本地假数据跑通全流程（无需网络）
 *  - api      ：指向你自己的后端服务（由后端转发大模型，Key 不落小程序，生产推荐）
 *  - deepseek ：小程序直连 DeepSeek API（单用户验证期用；Key 放 secret.ts，勿提交 Git）
 *
 * 直连模式注意：
 *  1. 开发者工具需勾选「详情 → 本地设置 → 不校验合法域名」
 *  2. DeepSeek 的 chat API 不支持图片输入；拍照批改走 vision 兼容层
 *     （见 ai.ts：批改用支持视觉的模型配置，讲解用 deepseek-chat）
 */

export type Mode = 'mock' | 'api' | 'deepseek'

export const MODE: Mode = 'deepseek'

// ===== api 模式（自有后端）=====
export const API_BASE = 'https://your-server.example.com' // 替换为你的后端地址

// ===== deepseek 直连模式 =====
export const DEEPSEEK_BASE = 'https://api.deepseek.com'
/** 讲解/变式/判答：文本模型（deepseek-flash 同样支持视觉，文本任务也用它，统一模型省配置） */
export const DEEPSEEK_CHAT_MODEL = 'deepseek-flash'
/** 批改：deepseek-flash 官方支持 image_url 视觉输入（见 docs /guides/vision） */
export const DEEPSEEK_VISION_MODEL = 'deepseek-flash'
