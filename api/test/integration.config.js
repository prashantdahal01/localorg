import { URL } from 'node:url'

export function getIsolatedTestMongoUri(environment = process.env) {
  const rawUri = environment.TEST_MONGO_URI
  if (!rawUri) {
    throw new Error('Refusing integration tests: TEST_MONGO_URI is not configured.')
  }

  const uri = new URL(rawUri)
  const database = uri.pathname.replace(/^\/+/, '')
  if (!/^localorg_test(?:[_-][a-z0-9_-]+)?$/i.test(database)) {
    throw new Error('Refusing integration tests: TEST_MONGO_URI must target a localorg_test database.')
  }
  return rawUri
}
