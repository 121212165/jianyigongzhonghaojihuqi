const pages = [
  'pages/home/index',
  'pages/config/index',
  'pages/profile/index',
  'pages/login/index',
  'pages/push-settings/index',
  'pages/data-source/index'
]

//  To fully leverage TypeScript's type safety and ensure its correctness, always enclose the configuration object within the global defineAppConfig helper function.
export default defineAppConfig({
  pages,
  tabBar: {
    // List requires at least 2 items and at most 5 items
    list: [
      {
        pagePath: 'pages/home/index',
        text: '简报',
        iconPath: './assets/icons/home_unselected.png',
        selectedIconPath: './assets/icons/home_selected.png'
      },
      {
        pagePath: 'pages/config/index',
        text: '配置',
        iconPath: './assets/icons/config_unselected.png',
        selectedIconPath: './assets/icons/config_selected.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/icons/profile_unselected.png',
        selectedIconPath: './assets/icons/profile_selected.png'
      }
    ],
    color: '#666666',
    selectedColor: '#1A1A1A',
    backgroundColor: '#F7F7F5',
    borderStyle: 'white'
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#F7F7F5',
    navigationBarTitleText: '公众号内容聚合助手',
    navigationBarTextStyle: 'black'
  }
})
