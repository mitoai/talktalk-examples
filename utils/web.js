// @flow

import type { BaseMessage } from 'talktalk/lib/dispatcher'
import type { WitEntities } from './wit'
import http from 'http'
import config from 'config'
import SocketIo from 'socket.io'
import { Dispatcher } from 'talktalk'
import { findBestCandidate, witEntitiesFromMessage } from './wit'

export type WebMessage = BaseMessage & { message: string }
export type WebReply = { message: string } | { gif: string }
export type WitWebMessage = WebMessage & { entities: WitEntities }

function serverHandler (req, res) {
  res.setHeader('Content-Type', 'text/html')
  res.writeHead(200)
  res.end(`
<html style="height: 100%">
   <body style='background: #e6e6e6;font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; font-size: 12pt; height: 100%; padding: 0; margin: 0'>
  <div style="position: absolute; bottom: 0">
  <ul id="Console" style="list-style-type: none; margin: 0; padding: 2em 0"></ul>
  <form id="Form">
    <input type="text" id="Input" style="border: 0.1em solid #aaa; width: 30em; height: 3em; line-height: 3em; padding: 1em;"/>
  </form>
</div>
  <script src="/socket.io/socket.io.js"></script>
  <script>
        var input = document.querySelector("#Input")
        var form = document.querySelector("#Form")
        var userId = "user" + Math.floor(Math.random() * 100000000)
        var socket = io('?userId=' + userId)
        var cons = document.querySelector("#Console") 
        function appendMessage(sender, message) {
          var li = document.createElement("li")
          li.innerHTML = "<div><span style='padding: 1em; min-width: 20em'>" + sender + "</span>"+ (message.message ? message.message : "<img src='" + message.gif + "'/>" )+"</div>"
          cons.appendChild(li)
        }
        socket.on('message', function (data) {
          appendMessage('Bot', data)
        });
        form.onsubmit = function (evt) {
          socket.emit("message", {type: 'message', sender: userId, message: input.value})
          appendMessage('You', {message: input.value})
          input.value = ""
          evt.preventDefault()
          return false
        }
  </script>
  </body></html>
`)
}

export class WebWitDispatcher extends Dispatcher<WitWebMessage, WebReply> {

  io = null

  constructor () {
    super(async (reply, message) => this && this.io ? this.io.to(message.sender).emit('message', reply) : null)
  }

  start () {
    const server = http.createServer(serverHandler)
    const io = SocketIo(server)
    io.on('connection', (socket) => {
      const userId = socket.handshake.query.userId
      if (!userId) return
      socket.on('message', async msg => {
        const entities = await witEntitiesFromMessage(msg.message)
        const intent = entities.intent && findBestCandidate(entities.intent)
        this.handleMessage({...msg, entities, intent: intent ? intent.value : undefined})
      })
      socket.join(userId)
    })
    io.on('error', (err) => console.error(err))
    this.io = io
    server.listen(config.get('web.port'))
  }
}
