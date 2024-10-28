import axios from 'axios'
import * as cheerio from 'cheerio'
import { wrapper } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'

export default class MiterasClient {
  private baseUrl: string
  private username: string
  private password: string
  private client: any
  private baseHeaders: object
  private loginUrl: string
  private authUrl: string
  private cicoUrl: string
  private submitClockInUrl: string
  private submitClockOutUrl: string

  constructor(baseUrl: string, username: string, password: string) {
    this.baseUrl = baseUrl
    this.username = username
    this.password = password

    // axiosインスタンスにcookieサポートを追加
    const jar = new CookieJar()
    this.client = wrapper(axios.create({ jar, withCredentials: true }))

    this.baseHeaders = {
      'Accept-Language': 'ja',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
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
  private getFormCsrf(html: string): string {
    const $ = cheerio.load(html)
    const csrfToken = $('input[name="_csrf"]').val() as string
    if (!csrfToken) {
      throw new Error(`Failed to retrieve CSRF token in ${this.loginUrl}`)
    }
    return csrfToken
  }

  // CSRFトークンを取得 (打刻ページはmetaタグから取得)
  private getMetaCsrf(html: string): string {
    const $ = cheerio.load(html)
    const csrfToken = $('meta[name="_csrf"]').attr('content')
    if (!csrfToken) {
      throw new Error(`Failed to retrieve CSRF token in ${this.cicoUrl}`)
    }
    return csrfToken
  }

  private getUpdatedDate(html: string): string {
    const $ = cheerio.load(html)
    const updatedDate = $('#daily-attendance').attr('data-updated-date')
    return updatedDate ? updatedDate.toString() : ''
  }

  // ログイン処理
  public async login(): Promise<this> {
    console.log('GET', this.loginUrl)
    const loginRes = await this.client.get(this.loginUrl, { headers: this.baseHeaders })
    const loginCsrf = this.getFormCsrf(loginRes.data)

    console.log('POST', this.authUrl)
    const authRes = await this.client.post(
      this.authUrl,
      new URLSearchParams({
        _csrf: loginCsrf,
        username: this.username,
        password: this.password
      }).toString(),
      {
        headers: {
          ...this.baseHeaders,
          Referer: this.loginUrl,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    console.log('STATUS', authRes.status)
    const authResponseUrl = authRes.request.res.responseUrl
    console.log('REDIRECT TO', authResponseUrl)
    if (authRes.status !== 200 || authResponseUrl !== this.cicoUrl) {
      throw new Error('ログインに失敗しました。')
    }
    return this
  }

  // 出社打刻
  public async clockIn(): Promise<this> {
    console.log('GET', this.cicoUrl)
    const cico = await this.client.get(this.cicoUrl, { headers: this.baseHeaders })
    const cicoCsrf = this.getMetaCsrf(cico.data)

    console.log('POST', this.submitClockInUrl)
    const submit = await this.client.post(
      this.submitClockInUrl,
      {
        clockInCondition: { condition: 1 },
        dailyPlaceEvidence: {},
        workDateString: this.getCurrentDate(),
        enableBreakTime: false
      },
      {
        headers: {
          ...this.baseHeaders,
          Referer: this.cicoUrl,
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': cicoCsrf
        }
      }
    )
    console.log('STATUS', submit.status)
    console.log('RESPONSE', submit.data)
    if (submit.status !== 200) {
      throw new Error('送信エラーが発生しました。')
    }
    if (submit.data?.returnValue !== 'Success') {
      throw new Error('出社済みや休日でないかご確認ください。')
    }
    return this
  }

  // 退社打刻
  public async clockOut(): Promise<this> {
    console.log('GET', this.cicoUrl)
    const cico = await this.client.get(this.cicoUrl, { headers: this.baseHeaders })
    const cicoCsrf = this.getMetaCsrf(cico.data)
    const updatedDate = this.getUpdatedDate(cico.data)

    console.log('POST', this.submitClockOutUrl)
    const submit = await this.client.post(
      this.submitClockOutUrl,
      {
        clockOutCondition: { condition: 1 },
        dailyPlaceEvidence: {},
        workDateString: this.getCurrentDate(),
        stampBreakStart: '',
        stampBreakEnd: '',
        updatedDateString: updatedDate
      },
      {
        headers: {
          ...this.baseHeaders,
          Referer: this.cicoUrl,
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': cicoCsrf
        }
      }
    )

    console.log('STATUS', submit.status)
    console.log('RESPONSE', submit.data)
    if (submit.status !== 200) {
      throw new Error('送信エラーが発生しました。')
    }
    if (submit.data?.returnValue !== 'Success') {
      throw new Error('退社済みや休日でないかご確認ください。')
    }
    return this
  }
}
