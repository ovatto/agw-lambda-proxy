# Lambda Proxy Promise

Adapter module for creating Lambda functions for handling API Gateway Lambda
Proxy Integration calls. Provides common error handling and response formatting.

## Installation

Simply install with [npm](http://npmjs.org):

```sh
npm install lambda-proxy-promise
```

## Usage

The module exports a function that can be used to generate a Lambda compatible
handler function.

```javascript
const delegate = (event, context) => {
  return 'static string';
};
module.exports = {
  handler: require('lambda-proxy-promise')(delegate)
};
```
