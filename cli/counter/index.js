// @flow

import { startCliBot, cliReplier } from '../../utils/cli'
import type { CliMessage, CliReply } from '../../utils/cli'
import { Dispatcher, Handler } from 'talktalk'

class CounterHandler extends Handler {
  async handleFirstMessage (message: CliMessage): Promise<*> {
    await this.sendReply({message: 'You have sent 1 message'})
    return {count: 1}
  }
}

const dispatcher: Dispatcher<CliMessage, CliReply> = new Dispatcher(cliReplier)

dispatcher.registerHandler(CounterHandler)

startCliBot(dispatcher)
