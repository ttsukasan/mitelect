import { nativeImage } from 'electron'
import path from 'path'
import icon16 from '../../resources/sunfish_16.png?asset'
import icon24 from '../../resources/sunfish_24.png?asset'
import icon32 from '../../resources/sunfish_32.png?asset'

// 最適なサイズのアイコンを選択
export function getIcon() {
  // macOSのRetinaディスプレイ向け
  if (
    process.platform === 'darwin' &&
    nativeImage.createFromPath(path.join(__dirname, '../../resources/icon-32.png'))
      .isMacTemplateImage
  ) {
    return icon32
  }

  // Windowsの高DPI環境向け
  if (
    process.platform === 'win32' &&
    (process.getSystemMetrics(0) > 1920 || process.getSystemMetrics(1) > 1080)
  ) {
    return icon24
  }

  // 通常環境（または16x16が推奨される場合）
  return icon16
}
