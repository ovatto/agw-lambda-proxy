# Changelog for AWS API Gateway Lambda Proxy Integration module

## [1.0.4] - 2018-01-19
* Added error logging and URL encoded log links so links are directly usable from response JSON without having to remove the escapes.

## [1.0.3] - 2018-01-19
* Added CloudWatch Logs link generation for error responses. By default the
error response now has a "log" attribute that contains a direct link to the
logs of the failing request.

## [1.0.2] - 2018-01-18
* Fixed package dependencies and setup Travis build.

## [1.0.0] - 2018-01-18
* Initial release with handler function generation.
