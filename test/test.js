/* global describe it */
const assert = require('assert')
const handler = require('..')

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

describe('lambda-proxy-promise', function () {
  describe('#handler()', function () {
    it('should throw when delegate is not a function', function () {
      assert.throws(() => {
        handler(null)
      }, /"delegate" must be a function/)
    })
    it('should return a function when parameters are valid', function () {
      assert(typeof handler(() => 'x') === 'function')
    })
  })

  describe('#handler() output function', function () {
    it('should return the string returned from delegate as default response "body"', function () {
      return asPromise(callback => handler(() => 'expected')({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, 'expected', 'Response body should be the string returned from delegate function')
          assert.equal(response.statusCode, 200, 'Default status code 200 should be returned when response doesn\'t specify status code')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })
    it('should return the default response when delegate response is null', function () {
      return asPromise(callback => handler(() => null)({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, '', 'Response body should be empty when delegate does not specify body')
          assert.equal(response.statusCode, 200, 'Default status code 200 should be returned when response doesn\'t specify status code')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })
    it('should return the default response when delegate response doesn\'t contain any valid fields', function () {
      return asPromise(callback => handler(() => ({}))({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, '', 'Response body should be empty when delegate does not specify body')
          assert.equal(response.statusCode, 200, 'Default status code 200 should be returned when response doesn\'t specify status code')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })
    it('should return the "statusCode" from response', function () {
      return asPromise(callback => handler(() => ({statusCode: 123}))({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, '', 'Response body should be empty when delegate does not specify body')
          assert.equal(response.statusCode, 123, 'Response "statusCode" should match with delegate response\'s "statusCode"')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })
    it('should return the "body" string from response', function () {
      return asPromise(callback => handler(() => ({body: 'as string'}))({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, 'as string', 'Response body should match with delegate response\'s body')
          assert.equal(response.statusCode, 200, 'Default status code 200 should be returned when response doesn\'t specify status code')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })
    it('should return the "body" object from response as stringified JSON', function () {
      return asPromise(callback => handler(() => ({body: {foo: 'bar'}}))({}, {}, callback))
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
      return asPromise(callback => handler(() => ({headers: responseHeaders}))({}, {}, callback))
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
      return asPromise(callback => handler(() => ({headers: responseHeaders}))({}, {}, callback))
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
      return asPromise(callback => handler(() => null, {headers: optionsHeaders})({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, '', 'Response body should be empty when delegate does not specify body')
          assert.equal(response.statusCode, 200, 'Default status code 200 should be returned when response doesn\'t specify status code')
          assert.deepEqual(response.headers, optionsHeaders, '"options.headers" should be returned when response doesn\'t specify headers')
        })
    })
    it('should accept a promise returning function as delegate', function () {
      return asPromise(callback => handler(() => Promise.resolve('string from promise'))({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, 'string from promise', 'Response body should be the string returned from delegate function promise')
          assert.equal(response.statusCode, 200, 'Default status code 200 should be returned when response doesn\'t specify status code')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })
  })

  describe('#handler() output function error handling', function () {
    it('Should return "500" with error message when delegate function throws', function () {
      return asPromise(callback => handler(() => { throw new Error('error message') })({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, '{"message":"error message"}', 'Response body should contain the error message')
          assert.equal(response.statusCode, 500, 'Default error status code should be 500')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })

    it('Should return "500" with error message when delegate function is rejected', function () {
      return asPromise(callback => handler(() => Promise.reject(new Error('error message')))({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, '{"message":"error message"}', 'Response body should contain the error message')
          assert.equal(response.statusCode, 500, 'Default error status code should be 500')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })

    it('Should return error\'s "code" with error message when delegate function throws', function () {
      return asPromise(callback => handler(() => {
        const er = new Error('error message')
        er.code = 404
        throw er
      })({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, '{"message":"error message"}', 'Response body should contain the error message')
          assert.equal(response.statusCode, 404, 'Should use the error\'s "code" as response "statusCode"')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })

    it('Should return error\'s "code" with error message when delegate function is rejected', function () {
      return asPromise(callback => handler(() => {
        const er = new Error('error message')
        er.code = 404
        return Promise.reject(er)
      })({}, {}, callback))
        .then((response) => {
          assert.equal(response.body, '{"message":"error message"}', 'Response body should contain the error message')
          assert.equal(response.statusCode, 404, 'Should use the error\'s "code" as response "statusCode"')
          assert.deepEqual(response.headers, defaultHeaders, 'Default headers should be returned when response doesn\'t specify headers')
        })
    })
  })
})
