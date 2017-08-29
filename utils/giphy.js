// @flow
import request from 'superagent'
import config from 'config'

export async function fetchGif (q: string): Promise<?string> {
  const {body} = await request
    .get('https://api.giphy.com/v1/gifs/search')
    .query({
      api_key: config.get('giphy.apiKey'),
      q
    })
  if (!body.data.length) {
    return null
  }
  return body.data[0].images.fixed_width_downsampled.url
}

export async function fetchRandomGif (): Promise<?string> {
  const {body} = await request
    .get('https://api.giphy.com/v1/gifs/random')
    .query({
      api_key: config.get('giphy.apiKey')
    })
  return body.data.fixed_width_downsampled_url
}
