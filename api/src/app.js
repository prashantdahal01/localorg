import './config/env.js'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import routes from './routes/index.js'
import { errorHandler } from './middleware/errorMiddleware.js'

const app = express()

app.use(helmet())
app.use(cors({
    origin: process.env.WEB_URL,
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))

app.use(routes)
app.get('/api', (req, res) => res.json({ message: 'API is running' }))

app.use(errorHandler)

export default app
