import axios, { AxiosInstance } from 'axios'
import * as cheerio from 'cheerio'
import { wrapper } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'

const jar = new CookieJar()
const client = wrapper(axios.create({ jar, withCredentials: true }))

const baseHeaders = {
  'Accept-Language': 'ja',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
}

function getCurrentDate(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = ('0' + (date.getMonth() + 1)).slice(-2)
  const day = ('0' + date.getDate()).slice(-2)
  return `${year}-${month}-${day}`
}

function getFormCsrf(axiosResponseData: any): string{
  const $ = cheerio.load(axiosResponseData)
  const csrfToken = $('input[name="_csrf"]').val() as string
  if (!csrfToken) {
    throw new Error('CSRFトークンが取得できませんでした')
  }
  return csrfToken
}

function getMetaCsrf(axiosResponseData: any): string{
  const $ = cheerio.load(axiosResponseData)
  const csrfToken = $('meta[name="_csrf"]').attr('content')
  if (!csrfToken) {
    console.log(axiosResponseData)
    throw new Error('CSRFトークンが取得できませんでした')
  }
  return csrfToken
}

async function login(baseUrl: string, username: string, password: string){
  const loginUrl = `${baseUrl}login`
  console.log('ログインを実行します。', loginUrl)
  const loginResponse = await client.get(loginUrl, { headers: baseHeaders })
  const loginCsrf = getFormCsrf(loginResponse.data)

  const authResponse = await client.post(
    `${baseUrl}auth`,
    new URLSearchParams({
      _csrf: loginCsrf,
      username: username,
      password: password,
    }).toString(),
    {
      headers: {
        ...baseHeaders,
        'Referer': loginUrl,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )

  const authResponseUrl = authResponse.request.res.responseUrl
  if (authResponse.status === 200 && authResponseUrl === `${baseUrl}cico`) {
    console.log('ログインに成功しました。', authResponse.status, authResponseUrl)
  } else {
    console.error('ログインに失敗しました。', authResponse.status, authResponseUrl)
    throw new Error('ログインに失敗しました。')
  }
}


// 出社打刻
export async function clockIn(baseUrl: string, username: string, password: string) {
  try {
    await login(baseUrl, username, password)

    console.log('打刻を実行します。', `${baseUrl}cico`)
    const cicoResponse = await client.get(`${baseUrl}cico`, { headers: baseHeaders })
    const cicoCsrf = getMetaCsrf(cicoResponse.data)
    console.log(cicoCsrf, getCurrentDate())

    // const submitResponse = await client.post(
    //   `${baseUrl}submitClockIn`,
    //   new URLSearchParams({
    //     clock_in_condition: "best",
    //     daily_place_evidence: "",
    //     work_date_string: getCurrentDate(),
    //     enable_break_time: "false",
    //   }).toString(),
    //   {
    //     headers: {
    //       ...baseHeaders,
    //       'Referer': `${baseUrl}cico`,
    //       'Content-Type': 'application/x-www-form-urlencoded',
    //       'X-CSRF-TOKEN': cicoCsrf
    //     }
    //   }
    // )
    // console.log(submitResponse.data)
  } catch (error) {
    console.error('出社打刻中にエラーが発生しました:', error)
  }
}

// 退社打刻
export function clockOut() {
  console.log('退社打刻を実行します...')
  // 実際の退社打刻処理をここに実装
}
