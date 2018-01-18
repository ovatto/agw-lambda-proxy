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

const isLambdaResponse = (response) => {
  return response &&
    typeof response === 'object' &&
    ['statusCode', 'body', 'headers'].find(f => Object.prototype.hasOwnProperty.call(response, f))
}

const DEFAULT_STATUS_CODE = 200

const formatResponse = (response, options) => {
  if (isLambdaResponse(response)) {
    return {
      statusCode: Number.parseInt(response.statusCode) || DEFAULT_STATUS_CODE,
      body: formatBody(response.body),
      headers: formatHeaders(options, response.headers)
    }
  }
  return {
    statusCode: DEFAULT_STATUS_CODE,
    body: formatBody(response),
    headers: formatHeaders(options)
  }
}

const createErrorResponse = (error) => ({
  statusCode: error.code || 500,
  body: {
    message: error.message
  }
})

const DEFAULT_OPTIONS = {
  headers: {
    'Access-Control-Allow-Origin': '*'
  }
}

const createHandler = (delegate, options = DEFAULT_OPTIONS) => {
  if (typeof delegate !== 'function') {
    throw new Error('"delegate" must be a function')
  }
  return (event, context, callback) => {
    return Promise.resolve()
      .then(() => delegate(event, context))
      .catch(createErrorResponse)
      .then((response) => callback(null, formatResponse(response, options)))
  }
}

module.exports = {createHandler}
