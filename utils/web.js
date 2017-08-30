// @flow

import http from 'http'
import config from 'config'
import SocketIo from 'socket.io'
import EventEmitter from 'events'

type NamedPostback<C> = { name: string, postbackContext: C }

function buildServerHandler<C> (postback: ?NamedPostback<C>) {
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

export class Web<C> extends EventEmitter {

  onMessage (listener: (msg: { sender: string, message: string }) => any) {
    this.on('message', listener)
  }

  onPostback (listener: (postback: { sender: string, context: C }) => any) {
    this.on('postback', listener)
  }

  async sendMessage (receiver: string, message: ({ gif: string } | { message: string })) {
    this.emit('reply', {receiver, message})
  }

  start (postback: ?NamedPostback<C>) {
    const server = http.createServer(buildServerHandler(postback))
    const io = SocketIo(server)
    io.on('connection', (socket) => {
      const userId = socket.handshake.query.userId
      if (!userId) return
      socket.on('message', message => this.emit('message', {...message, sender: userId}))
      socket.on('postback', context => this.emit('postback', {sender: userId, context}))
      socket.join(userId)
    })
    this.on('reply', ({receiver, message}) => io.to(receiver).emit('message', message))
    io.on('error', (err) => console.error(err))
    server.listen(config.get('web.port'))
  }
}
