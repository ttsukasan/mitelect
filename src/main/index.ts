import { app, Menu, Tray, shell, Notification } from 'electron'
import path from 'path'
import fs from 'fs'
import { initTray } from './iconUtil'
import MiterasClient from './MiterasClient'

let tray: Tray | null = null
const configFilePath = path.join(app.getPath('userData'), 'config.json')

let config: {
  miterasCode: string
  username: string
  password: string
  readonly miterasUrl: string
}

// 設定ファイルの存在確認・作成・読み込み
function initializeConfig() {
  if (!fs.existsSync(configFilePath)) {
    const defaultConfig = {
      miterasCode: 'A123456',
      username: 'your.name',
      password: 'Passw0rd'
    }
    fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2))
  }

  const loadedConfig = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'))

  config = {
    ...loadedConfig,
    get miterasUrl() {
      return `https://kintai.miteras.jp/${this.miterasCode}/`
    }
  }
}

// 設定ファイルをテキストエディタで開く
function openConfigFile() {
  shell.openPath(configFilePath).then((result) => {
    if (result) {
      console.error('Failed to open config file:', result)
    }
  })
}

// デスクトップ通知のヘルパー関数
function showNotification(title: string, body: string) {
  new Notification({ title, body }).show()
}

// サイトを開く
function openBrowser() {
  const url = `${config.miterasUrl}/login`
  shell.openExternal(url).catch((error) => {
    console.error('Failed to open URL:', error)
  })
}

// 出社打刻を実行
function clockIn(){
  const cli = new MiterasClient(config.miterasUrl, config.username, config.password)
  cli.login().then(() => cli.clockIn().then()).catch((error) => {
    console.error(error)
    showNotification('打刻失敗', error.message)
  })
}

// 退社打刻を実行
function clockOut(){
  console.log('clockOut')
}

app.whenReady().then(() => {
  // 設定ファイルの初期化と読み込み
  initializeConfig()

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


export { config }
