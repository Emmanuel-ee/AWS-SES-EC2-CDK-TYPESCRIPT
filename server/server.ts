import http from 'http'
import app from './src/main'
import * as dotenv from 'dotenv'
dotenv.config()

export const PORT = process.env.PORT || 8000



const server = http.createServer(app)

server.listen(PORT, ()=>{
    console.log(`server is listening on port ${PORT}`)
})