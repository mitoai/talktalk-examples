// @flow

import { cliReplier, startCliBot } from '../../utils/cli'
import type { CliMessage, CliReply } from '../../utils/cli'
import { Dispatcher, Handler } from 'talktalk'

class QualityJudgeHandler extends Handler<*, *, *, *> {
  async handleJump (context: { number: number }) {
    await this.sendReply({message: `${context.number}... That's not very original`})
    this.jumpTo(IntroHandler, {})
  }
}

class IntroHandler extends Handler<*, *, *, *> {
  async handleFirstMessage (): Promise<*> {
    await this.sendReply({message: 'Hi'})
    await this.sendReply({message: 'Please give me a number between 0 and 100!'})
    return {}
  }

  async handleSessionMessage (message: CliMessage): Promise<*> {
    const number = parseInt(message.message)
    if (isNaN(number) || number < 0 || number > 100) {
      await this.sendReply({message: 'That is not a valid number...'})
      await this.sendReply({message: 'Try again!'})
      return {}
    }
    this.jumpTo(QualityJudgeHandler, {number})
  }

  async handleJump (): Promise<*> {
    this.sendReply({message: 'Try again!'})
    return {}
  }
}

const dispatcher: Dispatcher<CliMessage, CliReply> = new Dispatcher(cliReplier)

dispatcher.registerHandler(IntroHandler)

startCliBot(dispatcher)
