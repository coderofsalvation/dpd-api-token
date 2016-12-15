var monkeypatch = require('monkeypatch')
var Context = require('deployd/lib/context')
var patched = false
var ua = require('universal-analytics');
var lastEvent = false
var visitor = false
var timeoutEventSend = false

module.exports = function(Router, accountresource,apiTokenKey){

  if( process.env.GA_TOKEN && process.env.NODE_ENV == 'production' )
    visitor = ua( process.env.GA_TOKEN )

  var gaEvent = function(){
    console.dir(arguments)
    if( ! visitor ) return
    var args = Array.prototype.slice.call(arguments)
    args.unshift( process.env.APINAME || "api" )
    if( ! lastEvent ) lastEvent = visitor.event.apply( visitor, args)
    else lastEvent = lastEvent.event.apply( visitor, args )
    // this will send all events every 5 secs (and not more often)  
    if( timeoutEventSend !== false ) clearTimeout( timeoutEventSend )
    timeoutEventSend = setTimeout( function(){
      lastEvent.send()
      timeoutEventSend = false
    }, process.env.GA_BUFFERTIME || 5000 )
  }

  var middleware = function(req, res, next){
    var resources = process.server.resources
    if( !resources ) return next()
    var resource = resources.find(function(r){ return r.name == accountresource })
    var error = function(msg, noconsole){
      res.status(400).send({code:400, message:msg})
      if( !noconsole ) console.error(msg)
    }
    if( ! resource ) return error("dpd-api-token: resource '"+accountresource+"' not found :(")
    if( ! resource.properties[ apiTokenKey ] ) return error("dpd-api-token: please create property '"+apiTokenKey+"' in resource '"+accountresource+"'")

    if( req.username != 'anonymous' && req.headers['x-api-token'] && req.headers['x-api-version'] ){
      var query = {}
      query[ apiTokenKey ] = req.headers['x-api-token']
      resource.store.find(query, function(err, user){
        if( err || !user[0] ) return error("unknown apikey", true)
        var user = user[0]
        req.user = user
        req.username = user.username
        gaEvent("request."+user.username+".v"+req.headers['x-api-version'], req.method+" "+req.url )
        next()
      })
    }else{
      next()
    } 
    gaEvent("request", req.method+" "+req.url )
  }

  var route = Router.prototype.route
  Router.prototype.route = function(req, res){
    var args = arguments
    var me = this
    middleware( req, res, function(){
      return route.apply(me,args)
    })
  }

//  process.server.on('listening', function(){
//    if( process.server.resources && !patched){
//      var route = process.server.router.route
//      process.server.router.route = function(req, res){
//        var args = arguments
//        var me = this
//        console.log("route!")
//        middleware(resources, server, req, res, function(){
//          return route.apply(me,args)
//        })
//      }
//      patched = true
//      console.log("patch!")
//    }
//  })

  //monkeypatch( require('module').prototype,'require', function(original, modname ){

  //  if( modname == "./router" ){
  //    console.log("ja")
  //    var mod = original(modname)
  //    return function(resources,server){
  //      var route = mod.prototype.route
  //      mod.prototype.route = function(req, res){
  //        var args = arguments
  //        var me = this
  //        middleware(resources, server, req, res, function(){
  //          return route.apply(me,args)
  //        })
  //      }
  //      var router = new mod(resources,server)
  //      return router
  //    }
  //  }

  //  return original(modname)

  //})

}
