# Lambda Proxy Promise

Adapter module for creating Lambda functions for handling API Gateway Lambda
Proxy Integration calls. Provides common error handling and response formatting.

## Installation

Simply install with [npm](http://npmjs.org):

```sh
npm install lambda-proxy-promise
```

## Usage

## Response formatting

The delegate function can return the response in few different ways. The most
simple case is the string return value. In this case the response's body will
be string and default status code 200 is returned.

```javascript
const delegate = (event, context) => {
  return 'static string';
};
module.exports = {
  handler: require('lambda-proxy-promise')(delegate)
};

/**
 Response will be:

 {
   "statusCode": 200,
   "body": "static string"
 }
**/
```

If the return value is an object the framework will use fields *statusCode*,
*body*, and *headers* from the response. If any of the values is missing or
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
      };
    });
};
module.exports = {
  handler: require('lambda-proxy-promise')(delegate)
};

/**
 Response will be:

 {
   "statusCode": 201,
   "body": "{\"id\":\"123\",\"message\":\"Object created\"}
 }
**/
```

The response *body* can be either a string or an object. In case of a string
the *body* is used as-is. Objects are always stringified.

## Using promises

The delegate function can also return a promise:

```javascript
const delegateWithPromise = (event, context) => {
  return Promise.resolve('response body string');
};
const delegateWithDirectReturn = (event, context) => {
  return 'response body string';
};
```

## Error handling

Framework automatically handles thrown errors as well as rejections from the
delegate function. These errors are automatically converted to Lamda Proxy
Integration responses with appropriate status code. The default error code
is 500 but it can be overwritten by specifying "code" attribute on the thrown
error or on the rejection:

```javascript
const delegateThatThrows = (event, context) => {
  const error = new Error('message');
  error.code = 404;
  throw error; // or return Promise.reject(error);
};
```

Error's message will be included in the response body in the "message"
attribute.
