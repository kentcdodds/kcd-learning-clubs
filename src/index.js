import React from 'react'
import ReactDOM from 'react-dom'
import ky from 'ky'
import netlifyIdentity from 'netlify-identity-widget'
import {useAsync} from './hooks'

const api = ky.create({
  prefixUrl: `${process.env.REACT_APP_NETLIFY_FUNCTIONS_URL}/api`,
  retry: 0,
})

window.api = api

async function getUserInfo(code) {
  const result = await api
    .get('resolve-discord-code', {searchParams: {code}})
    .json()
  console.log({result})
  return result
}

// eslint-disable-next-line
function ConnectDiscord() {
  const [userInfo, setUserInfo] = React.useState(null)
  React.useEffect(() => {
    const fragment = new URLSearchParams(window.location.search.slice(1))

    if (fragment.has('code')) {
      getUserInfo(fragment.get('code'))
        .then(response => {
          setUserInfo(response)
        })
        .catch(console.error)
    }
  }, [])
  return (
    <>
      <div>Hello world</div>
      <a href="https://discord.com/api/oauth2/authorize?client_id=738096608440483870&redirect_uri=http%3A%2F%2Flocalhost%3A8888&response_type=code&scope=identify">
        Get info
      </a>
      {userInfo ? <pre>{JSON.stringify(userInfo, null, 2)}</pre> : null}
    </>
  )
}

function App() {
  const {data: user, error, status, run, setData} = useAsync()
  React.useEffect(() => {
    run(
      new Promise((resolve, reject) => {
        netlifyIdentity.on('init', resolve)
        netlifyIdentity.on('error', reject)
        netlifyIdentity.init()
      }),
    )
  }, [run])

  const expirationTime = user?.token?.expires_at
  React.useEffect(() => {
    if (!Number.isFinite(expirationTime)) return
    console.log('refreshing in: ', expirationTime - Date.now())
    const timeout = setTimeout(() => {
      console.log('refreshing')
      netlifyIdentity.refresh().then(access_token => {
        setData(({data}) => {
          return {
            ...data,
            token: {
              ...data.token,
              access_token,
            },
          }
        })
      })
    }, expirationTime - Date.now())
    return () => clearTimeout(timeout)
  }, [expirationTime, setData, user])

  function handleLogin() {
    netlifyIdentity.open('login')
  }

  function handleClick() {
    api.get('me', {
      headers: {
        Authorization: `${user.token.token_type} ${user.token.access_token}`,
      },
    })
  }

  return (
    <div>
      {status === 'pending' || status === 'idle' ? '...' : null}
      {status === 'resolved' ? (
        user ? (
          <>
            <pre>{JSON.stringify(user, null, 2)}</pre>
            <button onClick={handleClick}>Get Me</button>
          </>
        ) : (
          <button onClick={handleLogin}>Login</button>
        )
      ) : null}
      {status === 'rejected' ? <pre>{error.message}</pre> : null}
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('⚛'))
