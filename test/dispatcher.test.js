// @flow

import {Handler, Tester} from 'talktalk'
import type { BaseMessage } from 'talktalk/lib/dispatcher'
import assert from 'assert'

type Message = BaseMessage & {message: string}
type Reply = {message: string}
const tester : Tester<Message, Reply> = new Tester()

class HelloWorldHandler extends Handler {

  async handleFirstMessage () {
    this.sendReply({message: 'Hello world'})
  }
}

tester.dispatcher.registerHandler(HelloWorldHandler)

describe('dispatcher', () => {
  it('should send hello world', async () => {
  })
})
