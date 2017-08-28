// @flow

import readline from 'readline'
import type Dispatcher, { BaseMessage } from 'talktalk/lib/dispatcher'
import type { WitEntities } from './wit'
import { findBestCandidate, witEntitiesFromMessage } from './wit'

export type CliMessage = {
  type: 'message',
  intent?: string,
  sender: string,
  message: string
}

export type WitCliMessage = CliMessage & { entities: WitEntities }

export type CliReply = {
  message: string
}

function prompt<X: BaseMessage> (dispatcher: Dispatcher<X, CliReply>, rl, enricher: (m: CliMessage) => Promise<X>) {
  rl.question('You > ', (answer) => {
    const msg: CliMessage = {type: 'message', sender: 'cli', message: answer}
    enricher(msg)
      .then(newMsg => dispatcher.handleMessage(newMsg))
      .then(() => prompt(dispatcher, rl, enricher))
  })
}

export function startCliBot (dispatcher: Dispatcher<CliMessage, CliReply>) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  prompt(dispatcher, rl, async msg => msg)
}


async function enrichMessage (message: CliMessage): Promise<WitCliMessage> {
  const entities = await witEntitiesFromMessage(message.message)
  const intent = entities.intent && findBestCandidate(entities.intent).value
  return {
    ...message,
    entities,
    intent
  }
}

export function startCliWitBot (dispatcher: Dispatcher<WitCliMessage, CliReply>) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  prompt(dispatcher, rl, enrichMessage)
}

export async function cliReplier (reply: CliReply) {
  console.log('Bot > ' + reply.message)
}

