import Store from 'electron-store'

interface ConfigSchema {
  miterasCode: string;
  username: string;
  password: string;
}

const store = new Store<ConfigSchema>({
  defaults: {
    miterasCode: 'A123456',
    username: 'your.name',
    password: 'Passw0rd',
  },
  schema: {
    miterasCode: {
      type: 'string',
    },
    username: {
      type: 'string',
    },
    password: {
      type: 'string',
    },
  },
})

export default store
