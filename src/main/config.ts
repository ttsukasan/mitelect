import Store from 'electron-store'

interface ConfigSchema {
  companyAlias: string
  username: string
  password: string
}

const store = new Store<ConfigSchema>({
  serialize: (value) => JSON.stringify(value, null, '  '),
  defaults: {
    companyAlias: 'A123456',
    username: 'your.name',
    password: 'Passw0rd'
  },
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

export default store
