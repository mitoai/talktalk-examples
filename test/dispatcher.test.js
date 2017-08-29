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

describe('dispatncher', () => {
  it('should send hello world', async () => {
    const convo = tester.startConversation()
    await convo.sendMessage({message: 'Hi'})
    const reply = await convo.expectReply()
    assert(reply.message === 'Hello world')
  })
})
