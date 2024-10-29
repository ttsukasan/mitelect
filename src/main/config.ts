interface ConfigSchema {
  companyAlias: string
  username: string
  password: string
}

// @ts-ignore: ts-ignore
let store: any

// @ts-ignore: ts-ignore
async function getStore(): Promise<any> {
  if (!store) {
    const ElectronStore = (await import('electron-store')).default
    store = new ElectronStore<ConfigSchema>({
      defaults: {
        companyAlias: 'A123456',
        username: 'your.name',
        password: 'Passw0rd'
      },
      // @ts-ignore: なぜか "schema" が警告される
      schema: {
        companyAlias: {
          type: 'string'
        },
        username: {
          type: 'string'
        },
        password: {
          type: 'string'
        }
      }
    })
  }
  return store
}

export default getStore
