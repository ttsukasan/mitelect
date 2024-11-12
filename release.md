# MiteTray 1.0.4

システムトレーに常駐するMiterasのクライアントです。

## インストール

### Windows版

下に表示されている **MiteTray-1.0.x-setup.exe** をダウンロードし実行してください。

- インストール時に **WindowsによってPCが保護されました** と表示された場合は「詳細設定」→「実行」の順に進めてください。
  - 参考手順 [Buffaloサポート](https://www.buffalo.jp/support/faq/detail/124145337.html)
- **インストールしようとしているアプリは、Microsoft検証済みアプリではありません** と表示された場合は「インストール」または「アプリのおすすめ設定を変更」を実施してください。
  - 参考手順 [特許庁 電子出願ソフトサポート](https://www.pcinfo.jpo.go.jp/site/2_download/1_update/2_msstore.html)

インストール後、デスクトップにある MiteTray.exe を実行することで、システムトレーに常駐します。

### Mac版

~~MiteTray-1.0.x.dmg をダウンロードし実行してください。~~

作者にデベロッパIDが無いため配布できません😢<br/>
お手数ですが自身でビルドしてください。

<details>
<summary>手順(クリックして開く)</summary>

```shell
# リポジトリをクローンします
git clone --branch 1.0.4 git@github.com:ttsukasan/mitelecton.git
cd mitelecton

# パッケージインストールします
npm install

# Mac用にビルドします
npm run build:mac

# アプリを実行します
open dist/MiteTray-1.0.4.dmg
```

</details>

---

## 使い方

システムトレーの【 】アイコンをクリックすることでメニューが表示されます。

### 初期設定

メニューの「環境設定」を選択すると、設定ファイルが開きます。<br>
内容を更新して保存してください。

```json
{
  "companyAlias": "A123456", // ご利用のMiterasのURLに含まれる、Aから始まる7桁のコード
  "username": "your.name", // ログインユーザー名
  "password": "password" // ログインパスワード
}
```

### 出勤打刻/退勤打刻

メニューの「出勤打刻(Best)」や「退勤打刻(Best)」を選択することで、打刻が送信されます。<br>
Best/Good/Normal/Bad は、それぞれのMiterasの顔アイコンが指定されます。

### 自動起動

インストール後はOS起動時に自動起動されます。
