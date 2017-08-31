// @flow

import { cliReplier, startCliWitBot } from '../../utils/cli'
import type { CliReply, WitCliMessage } from '../../utils/cli'
import { Handler, Dispatcher } from 'talktalk'
import { findBestCandidate } from '../../utils/wit'
import { fetchGif } from '../../utils/giphy'

class GreetingHandler extends Handler {
  intent = 'greeting'

  async handleFirstMessage (msg): Promise<*> {
    this.sendReply({message: 'Hello there!'})
  }

}

class GifHandler extends Handler {
  intent = 'gif'

  async handleFirstMessage (msg): Promise<*> {
    await this.sendReply({message: 'Sure! What would you like your gif to be about?'})
    return {}
  }

  async handleSessionMessage (msg): Promise<*> {
    const subject = findBestCandidate(msg.entities.subject || [])
  }
}

const dispatcher: Dispatcher<WitCliMessage, CliReply> = new Dispatcher(cliReplier)

dispatcher.registerHandler(GreetingHandler)
dispatcher.registerHandler(GifHandler)

startCliWitBot(dispatcher)
