import { app, Menu, Tray, shell, Notification } from 'electron'
import { initTray, openEditor } from './util'
import MiterasClient from './MiterasClient'
import store from './config'

let tray: Tray | null = null

// store.getをts-ignoreするためのメソッド 😢
function storeGet(key: string): string {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return store.get(key)
}

// 設定ファイルをテキストエディタで開く
function openConfigFile(): void {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  openEditor(store.path)
}

// デスクトップ通知のヘルパー関数
function showNotification(title: string, body: string): void {
  new Notification({ title, body }).show()
}

function miterasUrl(): string {
  return `https://kintai.miteras.jp/${storeGet('companyAlias')}/`
}

// サイトを開く
function openBrowser(): void {
  const url = `${miterasUrl()}login`
  shell.openExternal(url).catch((error) => {
    console.error('Failed to open URL:', error)
  })
}

// 出社打刻を実行
function clockIn(condition: number): void {
  const cli = new MiterasClient(miterasUrl(), storeGet('username'), storeGet('password'))
  cli
    .login()
    .then(() => cli.clockIn(condition).then())
    .catch((error) => {
      console.error(error)
      showNotification('出社打刻に失敗しました。', error.message)
    })
}

// 退社打刻を実行
function clockOut(condition: number): void {
  const cli = new MiterasClient(miterasUrl(), storeGet('username'), storeGet('password'))
  cli
    .login()
    .then(() => cli.clockOut(condition).then())
    .catch((error) => {
      console.error(error)
      showNotification('退社打刻に失敗しました。', error.message)
    })
}

app.whenReady().then(() => {
  // タスクバートレイのアイコンとメニュー設定
  const contextMenu = Menu.buildFromTemplate([
    { label: '出社打刻(Best)', click: (): void => clockIn(MiterasClient.CONDITION_BEST) },
    { label: '出社打刻(Good)', click: (): void => clockIn(MiterasClient.CONDITION_GOOD) },
    { label: '出社打刻(Normal)', click: (): void => clockIn(MiterasClient.CONDITION_NORMAL) },
    { label: '出社打刻(Bad)', click: (): void => clockIn(MiterasClient.CONDITION_BAD) },
    { type: 'separator' },
    { label: '退社打刻(Best)', click: (): void => clockOut(MiterasClient.CONDITION_BEST) },
    { label: '退社打刻(Good)', click: (): void => clockOut(MiterasClient.CONDITION_GOOD) },
    { label: '退社打刻(Normal)', click: (): void => clockOut(MiterasClient.CONDITION_NORMAL) },
    { label: '退社打刻(Bad)', click: (): void => clockOut(MiterasClient.CONDITION_BAD) },
    { type: 'separator' },
    { label: 'Miterasを開く', click: openBrowser },
    { label: '環境設定', click: openConfigFile },
    { label: '終了', role: 'quit' }
  ])

  tray = initTray()
  tray.setContextMenu(contextMenu)

  if (!app.getLoginItemSettings().openAtLogin) app.setLoginItemSettings({ openAtLogin: true })
  app.setAppUserModelId('com.electron')
})
