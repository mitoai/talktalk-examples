// @flow

import { Handler, Dispatcher } from 'talktalk'
import { findBestCandidate, witEntitiesFromMessage } from '../../utils/wit'
import { Web } from '../../utils/web'
import { fetchGif } from '../../utils/giphy'
import type { WebMessage, WebReply } from '../../utils/wit'

/*
class GreetingHandler extends Handler {
  intent = 'greeting'

  async handleFirstMessage (msg): Promise<*> {

  }

}

class GifHandler extends Handler {
  intent = 'gif'

  async handleFirstMessage (msg): Promise<*> {

  }

  async handleSessionMessage (msg): Promise<*> {

  }

}

class DefaultHandler extends Handler {

  async handleMessage () {

  }
}
*/

const web = new Web()

const dispatcher: Dispatcher<WebMessage, WebReply> = new Dispatcher((reply, message) => web.sendMessage(message.sender, reply))

web.onMessage(async msg => {
  const entities = await witEntitiesFromMessage(msg.message)
  const intentCandidate = findBestCandidate(entities.intent, 0.5)
  const newMessage = {
    type: 'message',
    intent: intentCandidate ? intentCandidate.value : undefined,
    message: msg.message,
    sender: msg.sender,
    entities
  }
  dispatcher.handleMessage(newMessage)
})

web.start()
