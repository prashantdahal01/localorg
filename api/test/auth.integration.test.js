import test from 'node:test'
import assert from 'node:assert/strict'
import { getIsolatedTestMongoUri } from './integration.config.js'

test('integration setup refuses a missing or non-test database', () => {
  assert.throws(
    () => getIsolatedTestMongoUri({}),
    /TEST_MONGO_URI is not configured/,
  )
  assert.throws(
    () => getIsolatedTestMongoUri({ TEST_MONGO_URI: 'mongodb://localhost/localorg' }),
    /must target a localorg_test database/,
  )
})
