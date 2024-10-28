import { app, Menu, Tray, shell, Notification } from 'electron'
import { initTray, openEditor } from './util'
import MiterasClient from './MiterasClient'
import store from './config'

let tray: Tray | null = null

// store.getをts-ignoreするためのメソッド 😢
function storeGet(key): string {
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
function clockIn(): void {
  const cli = new MiterasClient(miterasUrl(), storeGet('username'), storeGet('password'))
  cli
    .login()
    .then(() => cli.clockIn().then())
    .catch((error) => {
      console.error(error)
      showNotification('出社打刻に失敗しました。', error.message)
    })
}

// 退社打刻を実行
function clockOut(): void {
  const cli = new MiterasClient(miterasUrl(), storeGet('username'), storeGet('password'))
  cli
    .login()
    .then(() => cli.clockOut().then())
    .catch((error) => {
      console.error(error)
      showNotification('退社打刻に失敗しました。', error.message)
    })
}

app.whenReady().then(() => {
  // タスクバートレイのアイコンとメニュー設定
  const contextMenu = Menu.buildFromTemplate([
    { label: '出社打刻', click: clockIn },
    { label: '退社打刻', click: clockOut },
    { type: 'separator' },
    { label: 'Miterasを開く', click: openBrowser },
    { label: '環境設定', click: openConfigFile },
    { label: '終了', role: 'quit' }
  ])

  tray = initTray()
  tray.setContextMenu(contextMenu)

  app.setAppUserModelId('com.electron')
})

// メインウィンドウを作成しないことで、タスクバーにアイコンが表示されなくなる
// app.on('window-all-closed', (event) => {
//   event.preventDefault() // ウィンドウが閉じられてもアプリが終了しないようにする
// })
