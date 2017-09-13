// @flow
import { Wit } from 'node-wit'
import config from 'config'
import type { BaseMessage } from 'talktalk/lib/dispatcher'

const accessToken = config.get('wit.accessToken')
const wit = new Wit({accessToken})

export type WitEntityMatch = {
  confidence: number,
  value: string,
  normalized?: { value: number }
}

export type WitEntities = {
  [string]: WitEntityMatch[]
}

export type WebReply = { message: string } | { gif: string }
export type WebMessage = BaseMessage & { message: string, entities: WitEntities }

export function findBestCandidate (matches?: WitEntityMatch[], confidence?: number = 0): ?WitEntityMatch {
  return (matches || [])
    .sort((i1, i2) => i2.confidence - i1.confidence)
    .filter(i => i.confidence >= confidence)[0]
}

export async function witEntitiesFromMessage (message: string): Promise<WitEntities> {
  if (!message) {
    return {}
  }
  return (await wit.message(message)).entities
}
