export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/result/result',
    'pages/tutor/tutor',
    'pages/history/history',
    'pages/book/book',
    'pages/wrong-detail/wrong-detail',
    'pages/report/report',
    'pages/medals/medals',
    'pages/mental/mental'
  ],
  window: {
    navigationBarBackgroundColor: '#FF8A3C',
    navigationBarTextStyle: 'white',
    navigationBarTitleText: 'AI 数学私教',
    backgroundColor: '#F7F8FA'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#FF8A3C',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '拍一拍',
        iconPath: 'assets/icons/camera.png',
        selectedIconPath: 'assets/icons/camera-active.png'
      },
      {
        pagePath: 'pages/book/book',
        text: '错题本',
        iconPath: 'assets/icons/book.png',
        selectedIconPath: 'assets/icons/book-active.png'
      },
      {
        pagePath: 'pages/history/history',
        text: '历史',
        iconPath: 'assets/icons/history.png',
        selectedIconPath: 'assets/icons/history-active.png'
      }
    ]
  }
})
