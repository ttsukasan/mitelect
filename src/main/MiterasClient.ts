import axios, { AxiosInstance } from 'axios'
import * as cheerio from 'cheerio'
import { wrapper } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'
import store from './config'

export default class MiterasClient {
  private client: AxiosInstance
  private baseHeaders: Record<string, string>
  loginUrl: string
  private authUrl: string
  private cicoUrl: string
  private submitClockInUrl: string
  private submitClockOutUrl: string

  static CONDITION = {
    BEST: 1,
    GOOD: 2,
    NORMAL: 3,
    BAD: 4
  }

  constructor() {
    this.baseHeaders = {
      'Accept-Language': 'ja',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
    }

    this.loginUrl = `${this.miterasUrl()}login`
    this.authUrl = `${this.miterasUrl()}auth`
    this.cicoUrl = `${this.miterasUrl()}cico`
    this.submitClockInUrl = `${this.miterasUrl()}submitClockIn`
    this.submitClockOutUrl = `${this.miterasUrl()}submitClockOut`
    this.client = axios.create() // fixme: 不要な初期化
  }

  // store.getをts-ignoreするためのメソッド 😢
  private storeGet(key: string): string {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return store.get(key)
  }

  private miterasUrl(): string {
    return `https://kintai.miteras.jp/${this.storeGet('companyAlias')}/`
  }

  // 現在の日付を yyyy-mm-dd 形式で取得
  private getCurrentDate(): string {
    const date = new Date()
    return date.toISOString().split('T')[0]
  }

  // ログインページのcsrfトークンを取得
  private async getLoginPageCsrf(): Promise<string> {
    const response = await this.client.get(this.loginUrl, { headers: this.baseHeaders })
    console.log('GET', this.loginUrl, 'STATUS', response.status)

    const $ = cheerio.load(response.data)
    if (response.status !== 200 || $('form#login_form').length !== 1) {
      throw new Error(`ログインページへのアクセスに失敗しました。  URL: ${this.loginUrl}`)
    }
    // CSRFトークンを取得 (ログインフォームはformから取得)
    const csrfToken = $('input[name="_csrf"]').val() as string
    if (!csrfToken) {
      throw new Error(`Failed to retrieve CSRF token in ${this.loginUrl}`)
    }
    return csrfToken
  }

  // 打刻ページのcsrfトークン、更新日時を取得
  private async getCicoPageParams(): Promise<object> {
    const response = await this.client.get(this.cicoUrl, { headers: this.baseHeaders })
    console.log('GET', this.cicoUrl, 'STATUS', response.status)

    if (response.status !== 200) {
      throw new Error(`打刻ページへのアクセスに失敗しました。  URL: ${this.cicoUrl}`)
    }
    const $ = cheerio.load(response.data)
    // CSRFトークンを取得 (打刻ページはmetaタグから取得)
    const csrfToken = $('meta[name="_csrf"]').attr('content')
    if (!csrfToken) {
      throw new Error(`Failed to retrieve CSRF token in ${this.cicoUrl}`)
    }
    // updatedDate 退社打刻に必要
    const updatedDate = $('#daily-attendance').attr('data-updated-date')?.toString() || ''

    return { csrf: csrfToken, updatedDate: updatedDate }
  }

  public initCookie(): this {
    // axiosインスタンスにcookieサポートを追加
    const jar = new CookieJar()
    this.client = wrapper(axios.create({ jar, withCredentials: true }))

    return this
  }

  // ログイン処理
  public async login(): Promise<this> {
    const csrf = await this.getLoginPageCsrf()
    const response = await this.client.post(
      this.authUrl,
      new URLSearchParams({
        _csrf: csrf,
        username: this.storeGet('username'),
        password: this.storeGet('password')
      }).toString(),
      {
        headers: {
          ...this.baseHeaders,
          Referer: this.loginUrl,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )
    console.log('POST', this.authUrl, 'STATUS', response.status)
    if (response.status !== 200 || response.request.res.responseUrl !== this.cicoUrl) {
      throw new Error('ログインに失敗しました。')
    }
    return this
  }

  // 出社打刻
  public async clockIn(condition: number): Promise<this> {
    const params = await this.getCicoPageParams()
    const response = await this.client.post(
      this.submitClockInUrl,
      {
        clockInCondition: { condition: condition },
        dailyPlaceEvidence: {},
        workDateString: this.getCurrentDate(),
        enableBreakTime: false
      },
      {
        headers: {
          ...this.baseHeaders,
          Referer: this.cicoUrl,
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': params['csrf']
        }
      }
    )
    console.log('POST', this.submitClockInUrl, 'STATUS', response.status)
    console.log('RESPONSE', response.data)
    if (response.status !== 200) {
      throw new Error('送信エラーが発生しました。')
    }
    if (response.data?.returnValue !== 'Success') {
      throw new Error('出社済みや休日でないかご確認ください。')
    }
    return this
  }

  // 退社打刻
  public async clockOut(condition: number): Promise<this> {
    const params = await this.getCicoPageParams()

    const response = await this.client.post(
      this.submitClockOutUrl,
      {
        clockOutCondition: { condition: condition },
        dailyPlaceEvidence: {},
        workDateString: this.getCurrentDate(),
        stampBreakStart: '',
        stampBreakEnd: '',
        updatedDateString: params['updatedDate']
      },
      {
        headers: {
          ...this.baseHeaders,
          Referer: this.cicoUrl,
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': params['csrf']
        }
      }
    )
    console.log('POST', this.submitClockOutUrl, 'STATUS', response.status)
    console.log('RESPONSE', response.data)
    if (response.status !== 200) {
      throw new Error('送信エラーが発生しました。')
    }
    if (response.data?.returnValue !== 'Success') {
      throw new Error('退社済みや休日でないかご確認ください。')
    }
    if (response.data?.warnmessage) {
      throw new Error(response.data.warnmessage)
    }
    return this
  }
}
