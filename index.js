var monkeypatch = require('monkeypatch')
var Context = require('deployd/lib/context')
var ga = require('./lib/ga.js')
var patched = false

ga.init()

module.exports = function(Router, accountresource,apiTokenKey){

  var middleware = function(req, res, next){

    var now = new Date().getTime()
    req.starttime = now
    var restime = 99999999
    var end = res.end
    res.end = function(){
      restime = ( new Date().getTime() - now )
      ga.pageview(req.url,req.method, restime)
      return end.apply(this, arguments )
    }

    var resources = process.server.resources
    if( !process.server.ga ) process.server.ga = ga

    if( !resources || !res ) return next()
    var resource = resources.find(function(r){ return r.name == accountresource })
    var error = function(msg, noconsole){
      if( !res.send ) return next() // weird edgecase
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
        ga.event("request."+user.username+".v"+req.headers['x-api-version'], req.method+" "+req.url )
        next()
      })
    }else{
      next()
    } 
    ga.event("request", req.method+" "+req.url )
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
