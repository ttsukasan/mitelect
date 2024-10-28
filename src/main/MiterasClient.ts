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
  private getFormCsrf(html: string): string {
    const $ = cheerio.load(html)
    const csrfToken = $('input[name="_csrf"]').val() as string
    if (!csrfToken) {
      throw new Error('CSRFトークンが取得できませんでした。')
    }
    return csrfToken
  }

  // CSRFトークンを取得 (打刻ページはmetaタグから取得)
  private getMetaCsrf(html: string): string {
    const $ = cheerio.load(html)
    const csrfToken = $('meta[name="_csrf"]').attr('content')
    if (!csrfToken) {
      throw new Error('CSRFトークンが取得できませんでした。')
    }
    return csrfToken
  }

  private getUpdatedDate(html: string): string {
    const $ = cheerio.load(html)
    const updatedDate = $('#daily-attendance').attr('data-updated-date')
    if (!updatedDate) {
      throw new Error('updatedDateが取得できませんでした。')
    }
    return updatedDate
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

      const submitResponse = await this.client.post(
        this.submitClockInUrl,
        {
          clockInCondition: {condition: 1},
          dailyPlaceEvidence: {},
          workDateString: this.getCurrentDate(),
          enableBreakTime: false,
        },
        {
          headers: {
            ...this.baseHeaders,
            'Referer': this.cicoUrl,
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': cicoCsrf,
          },
        },
      )
      console.log('打刻結果:', submitResponse.data)
      return this
    } catch (error) {
      console.error('出社打刻中にエラーが発生しました:', error)
      throw new Error('ログインに成功しましたが、出社打刻の送信でエラーが発生しました。')
    }
  }

  // 退社打刻
  public async clockOut(): Promise<this> {
    try {
      console.log('出社打刻を実行します。', this.cicoUrl)
      const cicoResponse = await this.client.get(this.cicoUrl, {headers: this.baseHeaders})
      const cicoCsrf = this.getMetaCsrf(cicoResponse.data)
      const updatedDate = this.getUpdatedDate(cicoResponse.data)

      console.log('退社打刻を実行します...')
      const submitResponse = await this.client.post(
        this.submitClockOutUrl,
        {
          clockOutCondition: {condition: 1},
          dailyPlaceEvidence: {},
          workDateString: this.getCurrentDate(),
          stampBreakStart: '',
          stampBreakEnd: '',
          updatedDateString: updatedDate,
        },
        {
          headers: {
            ...this.baseHeaders,
            'Referer': this.cicoUrl,
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': cicoCsrf,
          },
        },
      )
      console.log('打刻結果:', submitResponse.data)
      return this
      // 実際の退社打刻処理をここに実装
    } catch (error) {
      console.error('出社打刻中にエラーが発生しました:', error)
      throw new Error('ログインに成功しましたが、出社打刻の送信でエラーが発生しました。')

    }

  }
}
