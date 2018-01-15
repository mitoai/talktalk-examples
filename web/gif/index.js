// @flow

import { Handler, Dispatcher } from 'talktalk'
import { findBestCandidate, witEntitiesFromMessage } from '../../utils/wit'
import { Web } from '../../utils/web'
import { fetchGif, fetchRandomGif } from '../../utils/giphy'
import type { BaseMessage } from 'talktalk/lib/dispatcher'
import type { WitEntities } from '../../utils/wit'

class GreetingHandler extends Handler<*, *, *, *> {
  intent = 'greeting'

  async handleFirstMessage (msg): Promise<*> {
    this.sendReply({message: 'Hello there!'})
    return {}
  }

}

class GifHandler extends Handler<*, *, *, *> {
  intent = 'gif'

  async handleFirstMessage (msg): Promise<*> {
    await this.sendReply({message: 'Sure! What would you like your gif to be about?'})
    return {}
  }

  async handleSessionMessage (msg): Promise<*> {
    const candidate = msg.entities.subject && findBestCandidate(msg.entities.subject)
    if (!candidate || candidate.confidence < 0.5) {
      await this.sendReply({message: 'Sorry, I did not understand that. Please try again.'})
      return {}
    }
    await this.sendReply({message: `Ok, I'll see what I can find about "${candidate.value}"`})
    const gif = await fetchGif(candidate.value)
    if (!gif) {
      await this.sendReply({message: `I couldn't find any gif about ${candidate.value}`})
      return
    }
    await this.sendReply({message: 'I found this gif'})
    await this.sendReply({gif})
  }

  async handleJump (context: { action: 'gif' }) {
    const gif = await fetchRandomGif()
    if (!gif) throw new Error('No gif found')
    await this.sendReply({message: 'I found this gif'})
    await this.sendReply({gif})
  }
}

class DefaultHandler extends Handler<*, *, *, *> {

  async handleMessage () {
    this.sendReply({message: 'Sorry, I didn\'t get that.'})
  }
}

const web = new Web()

export type WebReply = { message: string } | { gif: string }
export type WebMessage = BaseMessage & { message: string, entities: WitEntities }

const dispatcher: Dispatcher<WebMessage, WebReply> = new Dispatcher((reply, message) => web.sendMessage(message.sender, reply))

dispatcher.registerHandler(GreetingHandler)
dispatcher.registerHandler(GifHandler)
dispatcher.registerHandler(DefaultHandler)

web.onMessage(async msg => {
  const entities = await witEntitiesFromMessage(msg.message)
  const intentCandidate = findBestCandidate((entities && entities.intent) || [])
  const intent = intentCandidate && intentCandidate.confidence > 0.5 ? intentCandidate.value : undefined
  const newMessage = {type: 'message', intent, message: msg.message, sender: msg.sender, entities}
  dispatcher.handleMessage(newMessage)
})

web.onPostback(({sender, context}) => dispatcher.handleMessage(dispatcher.buildPostback(GifHandler, context, sender)))

web.start({name: 'Gif', postbackContext: {action: 'gif'}})
