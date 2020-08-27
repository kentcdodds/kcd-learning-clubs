import React from 'react'
import ReactDOM from 'react-dom'
import ky from 'ky'
import netlifyIdentity from 'netlify-identity-widget'

const api = ky.create({
  prefixUrl: `${process.env.REACT_APP_NETLIFY_FUNCTIONS_URL}/api`,
  retry: 0,
})

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
  React.useEffect(() => {
    console.log('initializing')
    netlifyIdentity.init()
    netlifyIdentity.on('init', (...args) => {
      console.log('init', ...args)
    })
    netlifyIdentity.on('login', (...args) => {
      console.log('login', ...args)
    })
    netlifyIdentity.on('logout', (...args) => {
      console.log('logout', ...args)
    })
  }, [])

  function handleLogin() {
    netlifyIdentity.open('login')
  }

  return (
    <div>
      <button onClick={handleLogin}>Login</button>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('⚛'))
