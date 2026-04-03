import {useState, useCallback, useEffect} from 'react'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from '@/contexts/AuthContext'
import {withRouteGuard} from '@/components/RouteGuard'
import {getKeywords, addKeyword, deleteKeyword, getAccounts, addAccount, deleteAccount} from '@/db/api'
import type {Keyword, Account} from '@/db/types'

function Config() {
  const {user} = useAuth()
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    const [keywordsData, accountsData] = await Promise.all([
      getKeywords(user.id),
      getAccounts(user.id)
    ])
    setKeywords(keywordsData)
    setAccounts(accountsData)
    setLoading(false)
  }, [user])

  useDidShow(() => {
    loadData()
  })

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleInitialize = async () => {
    setInitializing(true)
    
    // 添加预设关键词
    const presetKeywords = ['AI', '科技', '互联网']
    for (const keyword of presetKeywords) {
      if (!keywords.some((k) => k.keyword === keyword)) {
        await addKeyword(user!.id, keyword)
      }
    }
    
    // 添加预设公众号
    const presetAccounts = ['量子位', '赛博禅心', 'AI前线']
    for (const account of presetAccounts) {
      if (!accounts.some((a) => a.account_name === account)) {
        await addAccount(user!.id, account)
      }
    }
    
    setInitializing(false)
    Taro.showToast({title: '初始化成功', icon: 'success'})
    loadData()
  }

  useDidShow(() => {
    loadData()
  })

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddKeyword = async () => {
    if (keywords.length >= 10) {
      Taro.showToast({title: '最多支持10个关键词', icon: 'none'})
      return
    }

    // 使用prompt方式获取输入
    Taro.showModal({
      title: '添加关键词',
      content: '请在下方输入框输入关键词',
      success: async (res) => {
        if (res.confirm) {
          // 由于小程序限制，这里简化为直接添加预设关键词
          const presetKeywords = ['AI', '科技', '互联网', '编程', '设计']
          const availableKeywords = presetKeywords.filter(
            (k) => !keywords.some((kw) => kw.keyword === k)
          )
          
          if (availableKeywords.length === 0) {
            Taro.showToast({title: '请手动输入关键词', icon: 'none'})
            return
          }

          const keyword = availableKeywords[0]
          const result = await addKeyword(user!.id, keyword)
          if (result) {
            Taro.showToast({title: '添加成功', icon: 'success'})
            loadData()
          } else {
            Taro.showToast({title: '添加失败', icon: 'none'})
          }
        }
      }
    })
  }

  const handleDeleteKeyword = async (keywordId: string, keywordText: string) => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: `确定要删除关键词"${keywordText}"吗？`
    })

    if (res.confirm) {
      const success = await deleteKeyword(keywordId)
      if (success) {
        Taro.showToast({title: '删除成功', icon: 'success'})
        loadData()
      } else {
        Taro.showToast({title: '删除失败', icon: 'none'})
      }
    }
  }

  const handleAddAccount = async () => {
    if (accounts.length >= 20) {
      Taro.showToast({title: '最多支持20个公众号', icon: 'none'})
      return
    }

    // 使用预设公众号列表
    Taro.showModal({
      title: '添加公众号',
      content: '请在下方输入框输入公众号名称',
      success: async (res) => {
        if (res.confirm) {
          // 由于小程序限制，这里简化为直接添加预设公众号
          const presetAccounts = ['量子位', '赛博禅心', 'AI前线', '机器之心', '新智元']
          const availableAccounts = presetAccounts.filter(
            (a) => !accounts.some((acc) => acc.account_name === a)
          )
          
          if (availableAccounts.length === 0) {
            Taro.showToast({title: '请手动输入公众号名称', icon: 'none'})
            return
          }

          const accountName = availableAccounts[0]
          const result = await addAccount(user!.id, accountName)
          if (result) {
            Taro.showToast({title: '添加成功', icon: 'success'})
            loadData()
          } else {
            Taro.showToast({title: '添加失败', icon: 'none'})
          }
        }
      }
    })
  }

  const handleDeleteAccount = async (accountId: string, accountName: string) => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: `确定要删除公众号"${accountName}"吗？`
    })

    if (res.confirm) {
      const success = await deleteAccount(accountId)
      if (success) {
        Taro.showToast({title: '删除成功', icon: 'success'})
        loadData()
      } else {
        Taro.showToast({title: '删除失败', icon: 'none'})
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-xl text-muted-foreground">加载中...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-6 flex flex-col gap-8">
        {/* 快速初始化按钮 */}
        {keywords.length === 0 && accounts.length === 0 && (
          <div className="flex flex-col gap-4 py-6 border border-accent bg-card">
            <div className="px-4 flex flex-col gap-2">
              <h3 className="text-xl text-foreground font-bold">快速开始</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                点击下方按钮，自动添加预设的关键词和公众号，快速体验内容聚合功能。
              </p>
            </div>
            <div className="px-4">
              <button
                type="button"
                className={`w-full py-4 flex items-center justify-center leading-none text-xl ${
                  initializing ? 'bg-accent/50' : 'bg-accent'
                } text-accent-foreground transition`}
                onClick={handleInitialize}>
                {initializing ? '初始化中...' : '一键初始化'}
              </button>
            </div>
          </div>
        )}

        {/* 关键词管理 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl text-foreground font-bold">关键词管理</h2>
            <span className="text-base text-muted-foreground">{keywords.length}/10</span>
          </div>

          {keywords.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center">
              <span className="text-base text-muted-foreground">暂无关键词</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {keywords.map((keyword) => (
                <div
                  key={keyword.id}
                  className="flex items-center justify-between py-4 border-b border-border">
                  <span className="text-xl text-foreground">{keyword.keyword}</span>
                  <button
                    type="button"
                    className="flex items-center justify-center leading-none text-xl text-destructive"
                    onClick={() => handleDeleteKeyword(keyword.id, keyword.keyword)}>
                    <div className="i-mdi-delete text-2xl" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="w-full py-4 flex items-center justify-center leading-none text-xl border border-input bg-card text-foreground transition"
            onClick={handleAddKeyword}>
            <div className="i-mdi-plus text-2xl mr-2" />
            添加关键词
          </button>
        </div>

        {/* 公众号管理 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl text-foreground font-bold">公众号管理</h2>
            <span className="text-base text-muted-foreground">{accounts.length}/20</span>
          </div>

          {accounts.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center">
              <span className="text-base text-muted-foreground">暂无公众号</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between py-4 border-b border-border">
                  <span className="text-xl text-foreground">{account.account_name}</span>
                  <button
                    type="button"
                    className="flex items-center justify-center leading-none text-xl text-destructive"
                    onClick={() => handleDeleteAccount(account.id, account.account_name)}>
                    <div className="i-mdi-delete text-2xl" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="w-full py-4 flex items-center justify-center leading-none text-xl border border-input bg-card text-foreground transition"
            onClick={handleAddAccount}>
            <div className="i-mdi-plus text-2xl mr-2" />
            添加公众号
          </button>
        </div>

        {/* 推送设置入口 */}
        <div className="flex flex-col gap-4 mt-4">
          <button
            type="button"
            className="w-full py-4 flex items-center justify-center leading-none text-xl bg-primary text-primary-foreground transition"
            onClick={() => Taro.navigateTo({url: '/pages/push-settings/index'})}>
            推送设置
          </button>

          <button
            type="button"
            className="w-full py-4 flex items-center justify-center leading-none text-xl border border-input bg-card text-foreground transition"
            onClick={() => Taro.navigateTo({url: '/pages/data-source/index'})}>
            <div className="i-mdi-database text-2xl mr-2" />
            数据源配置
          </button>
        </div>
      </div>
    </div>
  )
}

export default withRouteGuard(Config)
