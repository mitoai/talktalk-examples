// @flow

import { Handler } from 'talktalk'
import { findBestCandidate } from '../../utils/wit'
import { WebWitDispatcher } from '../../utils/web'
import { fetchGif, fetchRandomGif } from '../../utils/giphy'

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

  async handlePostback (context: {action: 'gif'}) {
    const gif = await fetchRandomGif()
    if (!gif) throw new Error('No gif found')
    await this.sendReply({message: 'I found this gif'})
    await this.sendReply({gif})
  }
}

class DefaultHandler extends Handler {

  async handleMessage () {
    this.sendReply({message: 'Sorry, I didn\'t get that.'})
  }
}

const dispatcher: WebWitDispatcher = new WebWitDispatcher()

dispatcher.registerHandler(GreetingHandler)
dispatcher.registerHandler(GifHandler)
dispatcher.registerHandler(DefaultHandler)

dispatcher.start({name: 'Gif', postbackContext: {action: 'gif'}, _Handler: GifHandler})
