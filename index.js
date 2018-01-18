const formatHeaders = (options, responseHeaders = {}) => {
  return Object.assign({}, options.headers, responseHeaders)
}

const formatBody = (body) => {
  if (!body) {
    return ''
  }
  if (typeof body === 'string') {
    return body
  }
  return JSON.stringify(body)
}

const formatResponse = (response, options) => {
  if (!response) {
    return {
      statusCode: 200,
      body: '',
      headers: formatHeaders(options)
    }
  }
  if (typeof response === 'string') {
    return {
      statusCode: 200,
      body: response,
      headers: formatHeaders(options)
    }
  }
  return {
    statusCode: response.statusCode || 200,
    body: formatBody(response.body),
    headers: formatHeaders(options, response.headers)
  }
}

const DEFAULT_OPTIONS = {
  'headers': {
    'Access-Control-Allow-Origin': '*'
  }
}

const handler = (delegate, options = DEFAULT_OPTIONS) => {
  if (typeof delegate !== 'function') {
    throw new Error('"delegate" must be a function')
  }
  return (event, context, callback) => {
    return Promise.resolve()
      .then(() => delegate(event, context))
      .catch((error) => {
        return {
          statusCode: error.code || 500,
          body: JSON.stringify({
            message: error.message
          })
        }
      })
      .then((response) => {
        callback(null, formatResponse(response, options))
      })
  }
}

module.exports = handler
