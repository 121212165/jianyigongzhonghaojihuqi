import {useState, useCallback, useEffect} from 'react'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from '@/contexts/AuthContext'
import {withRouteGuard} from '@/components/RouteGuard'

function DataSource() {
  const {user} = useAuth()
  const [dataSource, setDataSource] = useState<'sogou' | 'third_party'>('sogou')
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    // 从本地存储加载配置
    const savedDataSource = Taro.getStorageSync('dataSource') || 'sogou'
    const savedApiKey = Taro.getStorageSync('thirdPartyApiKey') || ''
    setDataSource(savedDataSource)
    setApiKey(savedApiKey)
  }, [])

  useDidShow(() => {
    loadData()
  })

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSave = async () => {
    setLoading(true)

    // 保存到本地存储
    Taro.setStorageSync('dataSource', dataSource)
    if (dataSource === 'third_party') {
      Taro.setStorageSync('thirdPartyApiKey', apiKey)
    }

    setLoading(false)
    Taro.showToast({title: '保存成功', icon: 'success'})
    Taro.navigateBack()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-6 flex flex-col gap-6">
        {/* 数据源选择 */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl text-foreground font-bold">数据源选择</h2>

          {/* 搜狗微信搜索 */}
          <div
            className={`flex flex-col gap-3 p-4 border ${
              dataSource === 'sogou' ? 'border-accent bg-accent/5' : 'border-border bg-card'
            }`}
            onClick={() => setDataSource('sogou')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 border flex items-center justify-center ${
                    dataSource === 'sogou' ? 'bg-accent border-accent' : 'border-input'
                  }`}>
                  {dataSource === 'sogou' && (
                    <div className="i-mdi-check text-xl text-accent-foreground" />
                  )}
                </div>
                <span className="text-xl text-foreground font-bold">搜狗微信搜索</span>
              </div>
              <span className="text-base text-accent">免费</span>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">
              通过搜狗微信搜索引擎抓取公众号文章，免费使用，但可能受到反爬虫限制，抓取速度较慢。
            </p>
          </div>

          {/* 第三方API */}
          <div
            className={`flex flex-col gap-3 p-4 border ${
              dataSource === 'third_party' ? 'border-accent bg-accent/5' : 'border-border bg-card'
            }`}
            onClick={() => setDataSource('third_party')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 border flex items-center justify-center ${
                    dataSource === 'third_party' ? 'bg-accent border-accent' : 'border-input'
                  }`}>
                  {dataSource === 'third_party' && (
                    <div className="i-mdi-check text-xl text-accent-foreground" />
                  )}
                </div>
                <span className="text-xl text-foreground font-bold">第三方API</span>
              </div>
              <span className="text-base text-destructive">付费</span>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">
              使用第三方数据服务（如新榜、清博等），需要API密钥，数据更稳定可靠，但需要付费。
            </p>
          </div>
        </div>

        {/* API密钥配置 */}
        {dataSource === 'third_party' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl text-foreground font-bold">API密钥配置</h2>
            <div className="flex flex-col gap-2">
              <span className="text-xl text-foreground">API Key</span>
              <div className="border border-input bg-card px-4 py-3 overflow-hidden">
                <input
                  className="w-full text-xl text-foreground bg-transparent outline-none"
                  type="text"
                  placeholder="请输入第三方API密钥"
                  value={apiKey}
                  onInput={(e) => {
                    const ev = e as any
                    setApiKey(ev.detail?.value ?? ev.target?.value ?? '')
                  }}
                />
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                请联系第三方服务提供商获取API密钥。密钥将安全存储在本地。
              </p>
            </div>
          </div>
        )}

        {/* 说明 */}
        <div className="flex flex-col gap-3 p-4 border border-border bg-card">
          <h3 className="text-xl text-foreground font-bold">使用说明</h3>
          <ul className="flex flex-col gap-2 text-base text-muted-foreground leading-relaxed">
            <li>• 搜狗微信搜索：免费，但可能受限，适合个人使用</li>
            <li>• 第三方API：稳定可靠，适合商业使用</li>
            <li>• 配置保存后，刷新文章时将使用选定的数据源</li>
            <li>• 建议先使用搜狗微信搜索测试功能</li>
          </ul>
        </div>

        {/* 保存按钮 */}
        <div className="flex flex-col gap-4 mt-4">
          <button
            type="button"
            className={`w-full py-4 flex items-center justify-center leading-none text-xl ${
              loading ? 'bg-primary/50' : 'bg-primary'
            } text-primary-foreground transition`}
            onClick={handleSave}>
            {loading ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default withRouteGuard(DataSource)
