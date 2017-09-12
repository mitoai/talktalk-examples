// @flow

import { Handler, Dispatcher } from 'talktalk'
import { findBestCandidate, witEntitiesFromMessage } from '../../utils/wit'
import { Web } from '../../utils/web'
import { fetchGif } from '../../utils/giphy'
import type { BaseMessage } from 'talktalk/lib/dispatcher'
import type { WitEntities } from '../../utils/wit'
import opn from 'opn'

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

const web = new Web()

export type WebReply = { message: string } | { gif: string }
export type WebMessage = BaseMessage & { message: string, entities: WitEntities }

const dispatcher: Dispatcher<WebMessage, WebReply> = new Dispatcher((reply, message) => web.sendMessage(message.sender, reply))

web.onMessage(async msg => {
  const entities = await witEntitiesFromMessage(msg.message)
  const intentCandidate = findBestCandidate((entities && entities.intent) || [])
  const intent = intentCandidate && intentCandidate.confidence > 0.5 ? intentCandidate.value : undefined
  const newMessage = {type: 'message', intent, message: msg.message, sender: msg.sender, entities}
  dispatcher.handleMessage(newMessage)
})

web.start()

opn('http://localhost:3001')
