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

The module exports contains a function **createHandler** that can be used for
generating the Lambda handler function. The generated function handles the
**event**, **context**, and **callback** parameters that the Lambda runtime
passes so it can be directly used as the handler for your Lambda function.

The generator function accepts two parameters: **delegate** and **options**. The
**delegate** is a mandatory parameter and must be a function. This function is
defined by the caller and can be used for processing the Lambda request - when
Lambda function is invoked the framework passes the **event** and **context**
parameters to the delegate for request processing. The return value of the
delegate function is used for generating the Lambda function response and it
should be either a promise or a direct value if asynchronous processing is not
needed. Rejections and thrown errors are automatically handled. See
[Error handling](#error-handling) for details.

The **options** parameter can be used for overriding some of the defaults in
the request and response processing, including response headers.

### Example

Assuming you've put "index.handler" as your Lambda handler value you can use
following index.js for simply returning a response with body "static string",
status code 200 and default headers (see [CORS & response headers](#cors-response-headers)
for details).

```javascript
const delegate = (event, context) => {
  return Promise.resolve('static string')
}
module.exports = {
  handler: require('agw-lambda-proxy').createHandler(delegate)
}
```

## Response formatting

The delegate function can return the response in few different ways. For simple
responses the function can return a string value. In this case the response's
body will be the returned string and default status code 200 is used. This
case is shown above.

If the return value is an object and the object contains one of the attributes
**statusCode**, **body**, or **headers** the Lambda response is generated from
these attributes and default values for missing attribute. If the **body** is
not a string value it is automatically stringified.

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
  handler: require('agw-lambda-proxy').createHandler(delegate)
}
```

The handling for each attribute is specified in the table below:

attribute|When specified|Default value
---------|--------------|-------------
statusCode|Parsed as an integer HTTP status code. If parsing fails, default is used.|200
body|If string, returned as is. Otherwise stringified with JSON.stringify|''
headers|Properties used as HTTP response headers.|See [CORS & response headers](#cors-response-headers)

If the returned object does not have any of the attributes **statusCode**,
**body** or **headers** the object is stringified as response body and default
status code 200 and headers are used.


## CORS & response headers

By default, the Lambda function response will specify the header
"Access-Control-Allow-Origin" with value "\*". The default behaviour can be
changed by providing an **options** object with **headers** attribute in the
handler creation:

```javascript
const defaultHeaders = {
  someHeader: 'bar'
}
module.exports = {
  handler: require('agw-lambda-proxy').createHandler(delegate, {headers:defaultHeaders})
}
```

When using the object format in the delegate return value the headers can
also be specified for individual responses:

```javascript
const delegate = (event, context) => {
  return {
    body: 'headers from return value will overwrite default headers if same keys are found',
    headers: {
      overwrite: 'from response'
    }
  }
}
const defaultHeaders = {
  overwrite: 'from defaults'
}
module.exports = {
  handler: require('agw-lambda-proxy').createHandler(delegate, {headers:defaultHeaders})
}
```

In the example above the response headers will contain value "from response" for
the header "overwrite" as delegate return value headers will take precedence
over default header values.


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
