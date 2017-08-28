// @flow

import { cliReplier, startCliBot } from '../../utils'
import type { CliMessage, CliReply } from '../../utils'
import { Dispatcher, Handler } from 'talktalk'

class EchoHandler extends Handler {
  async handleFirstMessage (message: CliMessage): Promise<*> {
    await this.sendReply({message: message.message})
  }
}

const dispatcher: Dispatcher<CliMessage, CliReply> = new Dispatcher(cliReplier)

dispatcher.registerHandler(EchoHandler)

startCliBot(dispatcher)
