async function handler() {
  return {
    statusCode: 200,
    body: JSON.stringify({success: true}),
  }
}

export {handler}
