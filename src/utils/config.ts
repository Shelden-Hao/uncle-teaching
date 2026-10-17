/**
 * 全局配置
 * MODE = 'mock' | 'api'
 *  - mock：开发初期无后端，本地假数据跑通全流程
 *  - api ：指向你自己的后端服务（由后端转发多模态大模型）
 */
export const MODE: 'mock' | 'api' = 'mock'

export const API_BASE = 'https://your-server.example.com' // 替换为你的后端地址
