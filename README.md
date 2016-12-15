Simple, Sessionless api-token authentication for deployd with Ganalytics API metrics support

![](https://raw.githubusercontent.com/coderofsalvation/dpd-api-token/master/metrics.png)

## Usage

    $ npm install dpd-acl-roles-permissions dpd-api-token --save

app.js:

      require('dpd-api-token')( require('deployd/lib/router'), 'users','apikey')  // <----- add this
      var deployd = require('deployd')
      var dpd = deployd({port:3000});
      dpd.listen();

test on the commandline:

    $ curl -X GET "http://localhost:1882/foo"
    {"message":"no permission / not loggedin (session expired)", "status":401, "statusCode":401}

    $ curl -X GET -H 'X-API-VERSION: 1.0' -H 'X-API-TOKEN: foo' "http://localhost:1882/foo"
    []

> NOTE: Follow [dpd-acl-roles-permissions](https://www.npmjs.com/package/dpd-acl-roles-permissions) tutorial. Once you got permissions going, come back here, and specify your resource-usercollection above ('users') and its property which holds the apikey ('apikey').

## Notes 

* both `X-API-VERSION` and `X-API-TOKEN` should be specified (version is only used for analytics ) {
* `req.user` or `ctx.req.user` is populated with the user when an `X-API-TOKEN`-header matches `apikey` of a `users`-collection.

## Api metrics using google analytics (GA)

make sure you set these environment variables:

* export GA_TOKEN=XX-XXXXXX
* export NODE_ENV=production
* export APINAME=myapi
* export GA_BUFFERTIME=5000

Basically each request is buffered, and sent as google analytics events every GA_BUFFERTIME milliseconds.

You can view realtime requests at `Realtime > Events`,  or create dashboards to sort/display the events.

> NOTE: you can add events to analytics,  anywhere from within deployd :

    process.server.ga.event("action name", "label/value")     // buffered event (adviced)
    process.server.ga.ua                                      // universal analytics object

for more info on `ua` usage see [docs](https://npmjs.org/package/universal-analytics)
