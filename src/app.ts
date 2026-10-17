import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { cleanOldPhotos } from './utils/store'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    // 单用户阶段：冷启动时清理超过 90 天的本地批改图片缓存
    cleanOldPhotos(90)
  })

  return children
}

export default App
