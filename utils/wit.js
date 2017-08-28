// @flow
import { Wit } from 'node-wit'
import config from 'config'

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

export function findBestCandidate (matches: WitEntityMatch[]): WitEntityMatch {
  return matches
    .reduce((i1, i2) => i1.confidence > i2.confidence
      ? i1
      : i2, {value: '', confidence: 0})
}

export async function witEntitiesFromMessage (message: string): Promise<WitEntities> {
  if (!message) {
    return {}
  }
  return (await wit.message(message)).entities
}
