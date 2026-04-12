import { createServer } from 'http'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'

const port = parseInt(process.env.PORT || '3005', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res)
  })

  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' },
    path: '/api/socketio',
  })

  io.on('connection', (socket) => {
    socket.on('join-session', (sessionId) => {
      socket.join(`session:${sessionId}`)
    })

    socket.on('leave-session', (sessionId) => {
      socket.leave(`session:${sessionId}`)
    })

    socket.on('new-answer', (data) => {
      io.to(`session:${data.session_id}`).emit('answer', data)
    })

    socket.on('new-reaction', (data) => {
      io.to(`session:${data.session_id}`).emit('reaction', data)
    })

    socket.on('question-changed', (data) => {
      io.to(`session:${data.session_id}`).emit('question-update', data)
    })

    socket.on('session-updated', (data) => {
      io.to(`session:${data.id}`).emit('session-update', data)
    })
  })

  httpServer.listen(port, () => {
    console.log(`> Server listening at http://localhost:${port} as ${dev ? 'development' : 'production'}`)
  })
})
