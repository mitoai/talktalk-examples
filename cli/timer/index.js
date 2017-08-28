// @flow
import { cliReplier, startCliWitBot } from '../../utils/cli'
import type { CliReply, WitCliMessage } from '../../utils/cli'
import { Dispatcher, Handler } from 'talktalk'
import { findBestCandidate } from '../../utils/wit'

class GreetingHandler extends Handler {
  intent = 'greeting'

  async handleFirstMessage (msg): Promise<*> {
    this.sendReply({message: 'Hello there!'})
    return {}
  }

}

function findDuration (message): ?number {
  const durationCandidate = message.entities.duration && findBestCandidate(message.entities.duration)
  if (!durationCandidate || durationCandidate.confidence < 0.5 || !durationCandidate.normalized) {
    return null
  }
  return durationCandidate.normalized.value
}

const dispatcher: Dispatcher<WitCliMessage, CliReply> = new Dispatcher(cliReplier)

class TimerHandler extends Handler {
  intent = 'timer'

  async handleFirstMessage (msg): Promise<*> {
    const duration = findDuration(msg)
    if (duration) {
      this.jumpTo(SetTimerHandler, {duration})
      return
    }
    await this.sendReply({message: 'When do you want your timer to start?'})
    return {}
  }

  async handleSessionMessage (msg): Promise<*> {
    const duration = findDuration(msg)
    if (duration) {
      this.jumpTo(SetTimerHandler, {duration})
      return
    }
    await this.sendReply({message: 'Sorry, I did not understand that. Please try again.'})
    return {}
  }
}

class SetTimerHandler extends Handler {

  _timer (id) {
    dispatcher.handleMessage(dispatcher.buildPostback(SetTimerHandler, { id }, 'cli'))
  }

  async handleJump (context: { duration: number }) {
    const id = Math.floor(Math.random() * 100000000).toString()
    setTimeout(() => this._timer(id), context.duration * 1000)
    await this.sendReply({message: `I've set a timer with id ${id}`})
  }

  async handlePostback (postback: { id: string }): * {
    await this.sendReply({message: `A timer with id ${postback.id} went off`})
  }
}

class FallbackHandler extends Handler {

  async handleMessage () {
    await this.sendReply({message: 'Sorry. I did not get that.'})
  }
}

dispatcher.registerHandler(GreetingHandler)
dispatcher.registerHandler(TimerHandler)
dispatcher.registerHandler(FallbackHandler)
dispatcher.registerHandler(SetTimerHandler)

startCliWitBot(dispatcher)
