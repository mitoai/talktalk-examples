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
    return {}
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
    if (!subject || subject.confidence < 0.5) {
      await this.sendReply({message: 'Did not get that! Try again'})
      return {}
    }
    const subjectValue = subject.value
    await this.sendReply({message: `Sure, looking "${subjectValue}" up!!!`})
    const gif = await fetchGif(subjectValue)
    if (gif) {
      await this.sendReply({message: gif})
    } else {
      await this.sendReply({message: 'No such gif. Try again'})
      return {}
    }
  }
}

const dispatcher: Dispatcher<WitCliMessage, CliReply> = new Dispatcher(cliReplier)

dispatcher.registerHandler(GreetingHandler)
dispatcher.registerHandler(GifHandler)

startCliWitBot(dispatcher)
