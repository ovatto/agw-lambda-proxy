const url = require('url')
const querystring = require('querystring')

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

const formatFilterParameter = (requestId) => querystring.escape(`"${requestId}"`)

const createLogLink = (context) => url.format({
  protocol: 'https',
  host: `${process.env.AWS_REGION}.console.aws.amazon.com`,
  pathname: '/cloudwatch/home',
  search: `region=${process.env.AWS_REGION}`,
  hash: `logEventViewer:group=${process.env.AWS_LAMBDA_LOG_GROUP_NAME};filter=${formatFilterParameter(context.awsRequestId)}`
})

const requestErrorHandler = (context, options) => (error) => {
  if (options.logErrors) {
    console.error(error)
  }
  return {
    statusCode: error.code || 500,
    body: {
      message: options.errorFormatter(error),
      log: options.cloudWatchLogLinks ? createLogLink(context) : undefined
    }
  }
}

const DEFAULT_OPTIONS = {
  headers: {
    'Access-Control-Allow-Origin': '*'
  },
  cloudWatchLogLinks: true,
  logErrors: true,
  errorFormatter: (error) => error.message
}

const createHandler = (delegate, options = {}) => {
  if (typeof delegate !== 'function') {
    throw new Error('"delegate" must be a function')
  }
  const combinedOptions = Object.assign({}, DEFAULT_OPTIONS, options)
  return (event, context, callback) => {
    return Promise.resolve()
      .then(() => delegate(event, context))
      .catch(requestErrorHandler(context, combinedOptions))
      .then((response) => callback(null, formatResponse(response, combinedOptions)))
  }
}

module.exports = {createHandler}
