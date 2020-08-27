import serverless from 'serverless-http'
import polka from 'polka'
import send from '@polka/send-type'
import got from 'got'

const app = polka()

function handleError(middleware) {
  return (req, res, next) =>
    middleware(req, res, next).catch(error =>
      send(res, error.statusCode ?? 500, {
        message: error.message,
        body: error.body,
        statusCode: error.statusCode ?? 500,
      }),
    )
}

function safeParse(string) {
  try {
    return JSON.parse(string)
  } catch (error) {
    return string
  }
}

function handleGotError(error) {
  error.statusCode = error.response.statusCode
  try {
    const body = safeParse(error.response.body)
    error.body = body
    error.message = JSON.stringify(body, null, 2) || error.message
  } catch {
    // ignore
  }
  return error
}

app.get(
  '/.netlify/functions/api/ping',
  handleError(async (req, res) => {
    send(res, 200, 'pong')
  }),
)

app.get(
  '/.netlify/functions/api/me',
  handleError(async (req, res) => {
    console.log(req.context)
    if (req.context?.clientContext?.user) {
      send(res, 200, req.context?.clientContext?.user)
    } else {
      send(res, 401, 'User not logged in.')
    }
  }),
)

app.get(
  '/.netlify/functions/api/resolve-discord-code',
  handleError(async (req, res) => {
    const authResult = await got
      .post('https://discordapp.com/api/oauth2/token', {
        form: {
          client_id: process.env.REACT_APP_DISCORD_CLIENT_ID,
          client_secret: process.env.REACT_APP_DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          redirect_uri: 'http://localhost:8888',
          code: req.query.code,
          scope: 'identify',
        },
        hooks: {beforeError: [handleGotError]},
      })
      .json()

    const userInfo = await got
      .get('https://discordapp.com/api/users/@me', {
        responseType: 'json',
        headers: {
          authorization: `${authResult.token_type} ${authResult.access_token}`,
        },
        hooks: {beforeError: [handleGotError]},
      })
      .json()

    send(res, 200, userInfo)
  }),
)

const handler = serverless(app, {
  request(req, event, context) {
    req.context = context
    req.context.requestContext = event.requestContext
  },
})

export {handler}
