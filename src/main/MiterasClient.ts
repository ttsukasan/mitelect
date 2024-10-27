import axios from 'axios'
import * as cheerio from 'cheerio'
import {wrapper} from 'axios-cookiejar-support'
import {CookieJar} from 'tough-cookie'

export default class MiterasClient {
  private baseUrl: string
  private username: string
  private password: string
  private client: any
  private baseHeaders: object
  private loginUrl: string
  // @ts-ignore
  private authUrl: string
  private cicoUrl: string
  // @ts-ignore
  private submitClockInUrl: string
  // @ts-ignore
  private submitClockOutUrl: string

  constructor(baseUrl: string, username: string, password: string) {
    this.baseUrl = baseUrl
    this.username = username
    this.password = password

    // axiosインスタンスにcookieサポートを追加
    const jar = new CookieJar()
    this.client = wrapper(axios.create({jar, withCredentials: true}))

    this.baseHeaders = {
      'Accept-Language': 'ja',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    }

    this.loginUrl = `${this.baseUrl}login`
    this.authUrl = `${this.baseUrl}auth`
    this.cicoUrl = `${this.baseUrl}cico`
    this.submitClockInUrl = `${this.baseUrl}submitClockIn`
    this.submitClockOutUrl = `${this.baseUrl}submitClockOut`
  }

  // 現在の日付を yyyy-mm-dd 形式で取得
  private getCurrentDate(): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = ('0' + (date.getMonth() + 1)).slice(-2)
    const day = ('0' + date.getDate()).slice(-2)
    return `${year}-${month}-${day}`
  }

  // CSRFトークンを取得 (ログインフォームはformから取得)
  private getFormCsrf(axiosResponseData: any): string {
    const $ = cheerio.load(axiosResponseData)
    const csrfToken = $('input[name="_csrf"]').val() as string
    if (!csrfToken) {
      throw new Error('CSRFトークンが取得できませんでした。')
    }
    return csrfToken
  }

  // CSRFトークンを取得 (打刻ページはmetaタグから取得)
  private getMetaCsrf(axiosResponseData: any): string {
    const $ = cheerio.load(axiosResponseData)
    const csrfToken = $('meta[name="_csrf"]').attr('content')
    if (!csrfToken) {
      throw new Error('CSRFトークンが取得できませんでした。')
    }
    return csrfToken
  }

  // ログイン処理
  public async login(): Promise<this> {
    console.log('ログインを実行します。', this.loginUrl)

    const loginResponse = await this.client.get(this.loginUrl, {headers: this.baseHeaders})
    const loginCsrf = this.getFormCsrf(loginResponse.data)

    const authResponse = await this.client.post(
      `${this.baseUrl}auth`,
      new URLSearchParams({
        _csrf: loginCsrf,
        username: this.username,
        password: this.password,
      }).toString(),
      {
        headers: {
          ...this.baseHeaders,
          Referer: this.loginUrl,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )

    const authResponseUrl = authResponse.request.res.responseUrl
    if (authResponse.status === 200 && authResponseUrl === this.cicoUrl) {
      console.log('ログインに成功しました。', authResponse.status, authResponseUrl)
    } else {
      console.error('ログインに失敗しました。', authResponse.status, authResponseUrl)
      throw new Error('ログインに失敗しました。')
    }
    return this
  }

  // 出社打刻
  public async clockIn(): Promise<this> {
    try {
      console.log('出社打刻を実行します。', this.cicoUrl)
      const cicoResponse = await this.client.get(this.cicoUrl, {headers: this.baseHeaders})
      const cicoCsrf = this.getMetaCsrf(cicoResponse.data)
      console.log('取得したCSRFトークン:', cicoCsrf)
      console.log('現在の日付:', this.getCurrentDate())
      throw new Error('dummy')

      // // submitClockInにPOST送信（コメントアウトされた部分を利用）
      // const submitResponse = await this.client.post(
      //   `${this.baseUrl}submitClockIn`,
      //   new URLSearchParams({
      //     clock_in_condition: "best",
      //     daily_place_evidence: "",
      //     work_date_string: this.getCurrentDate(),
      //     enable_break_time: "false",
      //   }).toString(),
      //   {
      //     headers: {
      //       ...this.baseHeaders,
      //       'Referer': `${this.baseUrl}cico`,
      //       'Content-Type': 'application/x-www-form-urlencoded',
      //       'X-CSRF-TOKEN': cicoCsrf
      //     }
      //   }
      // )
      // console.log('打刻結果:', submitResponse.data)
      return this
    } catch (error) {
      console.error('出社打刻中にエラーが発生しました:', error)
      throw new Error('ログインに成功しましたが、出社打刻の送信でエラーが発生しました。')
    }
  }

  // 退社打刻
  public clockOut(): void {
    console.log('退社打刻を実行します...')
    // 実際の退社打刻処理をここに実装
  }
}
