// @flow

import type { BaseMessage } from 'talktalk/lib/dispatcher'
import type Handler from 'talktalk/lib/handler'
import type { WitEntities } from './wit'
import http from 'http'
import config from 'config'
import SocketIo from 'socket.io'
import { Dispatcher } from 'talktalk'
import { findBestCandidate, witEntitiesFromMessage } from './wit'

export type WebMessage = BaseMessage & { message: string }
export type WebReply = { message: string } | { gif: string }
export type WitWebMessage = WebMessage & { entities: WitEntities }
type NamedPostback<C> = { name: string, postbackContext: C, _Handler: Class<Handler<*, *, C, *, *>> }

function buildServerHandler (postback: ?NamedPostback<*>) {
  return (req, res) => {
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
  ${postback ? `<button id="Postback" style="width: 13em;height: 3em;margin-bottom: 2em;">${postback.name}</button>` : ''}
</div>
  <script src="/socket.io/socket.io.js"></script>
  <script>
        var input = document.querySelector("#Input")
        var form = document.querySelector("#Form")
        var userId = "user" + Math.floor(Math.random() * 100000000)
        var socket = io('?userId=' + userId)
        var cons = document.querySelector("#Console") 
        var postback = document.querySelector("#Postback")
        function appendMessage(sender, message) {
          var li = document.createElement("li")
          li.innerHTML = "<div><span style='padding: 1em; min-width: 20em'>" + sender + "</span>"+ (message.message ? message.message : "<img src='" + message.gif + "'/>" )+"</div>"
          cons.appendChild(li)
        }
        socket.on('message', function (data) {
          appendMessage('Bot', data)
        });
        if(postback) {
          postback.onclick = function (evt) {
            evt.preventDefault()
            socket.emit("postback", ${JSON.stringify(postback && postback.postbackContext)})
            appendMessage('You', {message: ${JSON.stringify((postback && postback.name) || '')}})
          }
        }
        form.onsubmit = function (evt) {
          socket.emit("message", {message: input.value})
          appendMessage('You', {message: input.value})
          input.value = ""
          evt.preventDefault()
          return false
        }
  </script>
  </body></html>
`)
  }
}

export class WebWitDispatcher extends Dispatcher<WitWebMessage, WebReply> {

  io = null

  constructor () {
    super(async (reply, message) => this && this.io ? this.io.to(message.sender).emit('message', reply) : null)
  }

  start (postback: ?NamedPostback<*>) {
    const server = http.createServer(buildServerHandler(postback))
    const io = SocketIo(server)
    io.on('connection', (socket) => {
      const userId = socket.handshake.query.userId
      if (!userId) return
      socket.on('message', async msg => {
        const entities = await witEntitiesFromMessage(msg.message)
        const intent = entities.intent && findBestCandidate(entities.intent)
        this.handleMessage({sender: userId, type: 'message', entities, intent: intent && intent.confidence > 0.8 ? intent.value : undefined, message: msg.message})
      })
      socket.on('postback', async context => {
        if (!postback) return
        this.handleMessage(this.buildPostback(postback._Handler, context, userId))
      })
      socket.join(userId)
    })
    io.on('error', (err) => console.error(err))
    this.io = io
    server.listen(config.get('web.port'))
  }
}
