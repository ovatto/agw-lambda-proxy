/* global describe it beforeEach */
const assert = require('assert')
const createHandler = require('..').createHandler

const asPromise = fn => {
  return new Promise((resolve, reject) => {
    fn((err, res) => {
      if (err) {
        return reject(err)
      }
      return resolve(res)
    })
  })
}

const defaultHeaders = {
  'Access-Control-Allow-Origin': '*'
}

const assertResponseBody = (response, expected) => {
  const parsed = JSON.parse(response.body)
  assert.deepEqual(parsed, expected, 'Response body should match with expected')
}

describe('agw-lambda-proxy', function () {
  describe('#createHandler()', function () {
    it('should throw when delegate is not a function', function () {
      assert.throws(() => {
        createHandler(null)
      }, /"delegate" must be a function/)
    })
    it('should return a function when parameters are valid', function () {
      assert(typeof createHandler(() => 'x') === 'function')
    })
  })

  describe('#createHandler() output function', function () {
    it('should return the string returned from delegate as default response "body"', function () {
      return asPromise(callback => createHandler(() => 'expected')({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, 'expected', 'Response body should be the string returned from delegate function')
          assert.equal(response.statusCode, 200, 'Default status code 200 should be returned when response doesn\'t specify status code')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })
    it('should return the default response when delegate response is null', function () {
      return asPromise(callback => createHandler(() => null)({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, '', 'Response body should be empty when delegate does not specify body')
          assert.equal(response.statusCode, 200, 'Default status code 200 should be returned when response doesn\'t specify status code')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })
    it('should return the "statusCode" from response', function () {
      return asPromise(callback => createHandler(() => ({statusCode: 123}))({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, '', 'Response body should be empty when delegate does not specify body')
          assert.equal(response.statusCode, 123, 'Response "statusCode" should match with delegate response\'s "statusCode"')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })
    it('should use default when "statusCode" from response is not valid', function () {
      return asPromise(callback => createHandler(() => ({statusCode: 'xxx'}))({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, '', 'Response body should be empty when delegate does not specify body')
          assert.equal(response.statusCode, 200, 'Default status code 200 should be returned when response doesn\'t specify a valid status code')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })
    it('should return the "body" string from response', function () {
      return asPromise(callback => createHandler(() => ({body: 'as string'}))({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, 'as string', 'Response body should match with delegate response\'s body')
          assert.equal(response.statusCode, 200, 'Default status code 200 should be returned when response doesn\'t specify status code')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })
    it('should return the "body" object from response as stringified JSON', function () {
      return asPromise(callback => createHandler(() => ({body: {foo: 'bar'}}))({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, '{"foo":"bar"}', 'Response body should match with delegate response\'s body')
          assert.equal(response.statusCode, 200, 'Default status code 200 should be returned when response doesn\'t specify status code')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })
    it('should return the "headers" from response as well as default headers when they\'re not overwritten', function () {
      const responseHeaders = {
        MY_HEADER: 'VALUE'
      }
      return asPromise(callback => createHandler(() => ({headers: responseHeaders}))({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, '', 'Response body should be empty when delegate does not specify body')
          assert.equal(response.statusCode, 200, 'Default status code 200 should be returned when response doesn\'t specify status code')
          assert.deepEqual(response.headers, Object.assign({}, defaultHeaders, responseHeaders), 'Response should have both delegate returned headers as well as default headers')
        })
    })
    it('should overwrite default "headers" when response specifies same keys', function () {
      const responseHeaders = {
        'Access-Control-Allow-Origin': 'https://foo.com'
      }
      return asPromise(callback => createHandler(() => ({headers: responseHeaders}))({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, '', 'Response body should be empty when delegate does not specify body')
          assert.equal(response.statusCode, 200, 'Default status code 200 should be returned when response doesn\'t specify status code')
          assert.deepEqual(response.headers, responseHeaders, 'Response overwrite default headers when delegate returns them')
        })
    })
    it('should return options headers when options has the key "headers"', function () {
      const optionsHeaders = {
        MY_DEFAULT_HEADER: 'value'
      }
      return asPromise(callback => createHandler(() => null, {headers: optionsHeaders})({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, '', 'Response body should be empty when delegate does not specify body')
          assert.equal(response.statusCode, 200, 'Default status code 200 should be returned when response doesn\'t specify status code')
          assert.deepEqual(response.headers, optionsHeaders, '"options.headers" should be returned when response doesn\'t specify headers')
        })
    })
    it('should return the returned object as stringified body when netiher statusCode, body nor headers is specified', function () {
      return asPromise(callback => createHandler(() => ({foo: 'bar'}))({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, '{"foo":"bar"}', 'Response body should the stringified delegate return object')
          assert.equal(response.statusCode, 200, 'Default status code 200 should be returned when response doesn\'t specify status code')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })
    it('should accept a promise returning function as delegate', function () {
      return asPromise(callback => createHandler(() => Promise.resolve('string from promise'))({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, 'string from promise', 'Response body should be the string returned from delegate function promise')
          assert.equal(response.statusCode, 200, 'Default status code 200 should be returned when response doesn\'t specify status code')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })
  })

  describe('#createHandler() output function error handling', function () {
    const context = {
      awsRequestId: 'UNIQUEREQUESTID'
    }
    beforeEach(function () {
      process.env.AWS_REGION = 'aws-region-id'
      process.env.AWS_LAMBDA_LOG_GROUP_NAME = '/aws/lambda/test-log-group'
    })

    it('Should return "500" with error message when delegate function throws', function () {
      return asPromise(callback => createHandler(() => { throw new Error('thrown error message') })({}, context, callback))
        .then((response) => {
          assertResponseBody(response, {
            message: 'thrown error message',
            log: 'https://aws-region-id.console.aws.amazon.com/cloudwatch/home?region=aws-region-id#logEventViewer:group=/aws/lambda/test-log-group;filter="UNIQUEREQUESTID"'
          })
          assert.equal(response.statusCode, 500, 'Default error status code should be 500')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })

    it('Should return "500" with error message when delegate function is rejected', function () {
      return asPromise(callback => createHandler(() => Promise.reject(new Error('rejected error message')))({}, context, callback))
        .then((response) => {
          assertResponseBody(response, {
            message: 'rejected error message',
            log: 'https://aws-region-id.console.aws.amazon.com/cloudwatch/home?region=aws-region-id#logEventViewer:group=/aws/lambda/test-log-group;filter="UNIQUEREQUESTID"'
          })
          assert.equal(response.statusCode, 500, 'Default error status code should be 500')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })

    it('Should return error\'s "code" with error message when delegate function throws', function () {
      return asPromise(callback => createHandler(() => {
        const er = new Error('thrown not found')
        er.code = 404
        throw er
      })({}, context, callback))
        .then((response) => {
          assertResponseBody(response, {
            message: 'thrown not found',
            log: 'https://aws-region-id.console.aws.amazon.com/cloudwatch/home?region=aws-region-id#logEventViewer:group=/aws/lambda/test-log-group;filter="UNIQUEREQUESTID"'
          })
          assert.equal(response.statusCode, 404, 'Should use the error\'s "code" as response "statusCode"')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })

    it('Should return error\'s "code" with error message when delegate function is rejected', function () {
      return asPromise(callback => createHandler(() => {
        const er = new Error('rejected not found')
        er.code = 404
        return Promise.reject(er)
      })({}, context, callback))
        .then((response) => {
          assertResponseBody(response, {
            message: 'rejected not found',
            log: 'https://aws-region-id.console.aws.amazon.com/cloudwatch/home?region=aws-region-id#logEventViewer:group=/aws/lambda/test-log-group;filter="UNIQUEREQUESTID"'
          })
          assert.equal(response.statusCode, 404, 'Should use the error\'s "code" as response "statusCode"')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })

    it('Should not return log link when "options.cloudWatchLogLinks" is false', function () {
      return asPromise(callback => createHandler(() => {
        const er = new Error('not expecting log link')
        return Promise.reject(er)
      }, {
        cloudWatchLogLinks: false
      })({}, context, callback))
        .then((response) => {
          assertResponseBody(response, {
            message: 'not expecting log link'
          })
          assert.equal(response.statusCode, 500, 'Default error status code should be 500')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })
  })
})
