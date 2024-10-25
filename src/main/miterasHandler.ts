// miterasHandler.ts
import { shell } from 'electron'
import { config } from './index' // configをインポート

export function openMiteras() {
  shell.openExternal(config.miterasUrl).then((result) => {
    if (result) {
      console.error('Failed to open Miteras URL:', result)
    }
  })
}
