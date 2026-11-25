import { getDatabaseStatus } from '../config/db.js'

export const getHealthStatus = async () => {
  return {
    status: 'ok',
    service: 'localorg-api',
    database: getDatabaseStatus(),
  }
}
