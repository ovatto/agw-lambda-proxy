# AWS API Gateway Lambda Proxy Integration module

Adapter module for creating Lambda functions for handling AWS API Gateway Lambda
Proxy Integration calls. See [docs](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-api-as-simple-proxy-for-lambda.html) for details.

Provides common error handling and response formatting.

## Installation

Simply install with [npm](http://npmjs.org):

```sh
npm install agw-lambda-proxy
```

## Usage

The module exports a function that can be used to generate the Lambda handler
function i.e. the returning function handles the **event**, **context**, and
**callback** parameters that the Lambda runtime passes to the function.

The actual function response is generated using caller provided delegate
function that can return either a direct value or a promise. Assuming you've put
"index.handler" as your Lambda handler value you can use following index.js:

```javascript
const delegate = (event, context) => {
  return Promise.resolve('static string')
}
module.exports = {
  handler: require('agw-lambda-proxy')(delegate)
}
```

## Delegate function

The module passes the Lambda handler function parameters **event** and **context**
to the delegate function. The delegate function is then free to process the
request, and once done, should return a promise or a direct value.

Rejections and thrown errors are automatically handled. See [Error handling](#error-handling)
for details.

## Response formatting

The delegate function can return the response in few different ways. For simple
responses the function can return a string value. In this case the response's
body will be the returned string and default status code 200 is returned. This
case is shown above.

If the return value is an object the framework will use fields **statusCode**,
**body**, and **headers** from the response. If any of the values is missing or
in incorrect format default values are returned.

```javascript
const delegate = (event, context) => {
  return callSomeCreationFunction()
    .then((created) => {
      return {
        statusCode: 201,
        body: {
          id: created.id,
          message: "Object created"
        }
      }
    })
}
module.exports = {
  handler: require('agw-lambda-proxy')(delegate)
}
```

The response **body** can be either a string or an object. In case of a string
the **body** is used as-is. Objects are always stringified.

## Error handling

The modules handles thrown errors as well as rejections from the delegate
function. These errors are automatically converted to Lamda Proxy Integration
responses with appropriate status code. The default error code is 500 but it
can be overwritten by specifying **code** attribute on the thrown error or on the
rejection:

```javascript
const delegateThatThrows = (event, context) => {
  const error = new Error('message')
  error.code = 404
  throw error // or return Promise.reject(error)
}
```

Error's message will be included in the response body in the "message"
attribute.
