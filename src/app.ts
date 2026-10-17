import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { cleanOldPhotos } from './utils/store'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    // 单用户阶段：冷启动时清理超过 90 天的本地批改图片缓存
    cleanOldPhotos(90)
  })

  // H5 端隐藏默认导航栏由页面内样式处理；端差异逻辑统一放 utils
  Taro.setNavigationBarTitle // 引用避免 tree-shaking 报错（保留占位）

  return children
}

export default App
