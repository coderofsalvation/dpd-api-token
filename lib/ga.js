var ua = require('universal-analytics');

module.exports = function(){ 

  // google analytics
  var visitor = false
  var gaBucket = {
    last: {
      event: false,
      pageView: false
    },
    timeout:{
      eventSend: false,
      pageViewSend: false
    }
  }

  this.init = function(){
    if( process.env.GA_TOKEN && process.env.NODE_ENV == 'production' )
      visitor = ua( process.env.GA_TOKEN )
  }

  
  this.pageview = function(path,method){
    if( ! visitor ) return
    var args = [{dp:path,dt:method}]
    if( ! gaBucket.last.pageView ) gaBucket.last.pageView = visitor.pageview.apply( visitor, args)
    else gaBucket.last.pageView = gaBucket.last.pageView.pageview.apply( visitor, args )
    // this will send all pageviews every 5 secs (and not more often)  
    if( gaBucket.timeout.pageViewSend !== false ) clearTimeout( gaBucket.timeout.pageViewSend )
    gaBucket.timeout.pageViewSend = setTimeout( function(){
      gaBucket.last.pageView.send()
      gaBucket.timeout.pageViewSend = false
    }, process.env.GA_BUFFERTIME || 5000 )
  }

  this.event = function(){
    if( ! visitor ) return
    var args = Array.prototype.slice.call(arguments)
    args.unshift( process.env.APINAME || "api" )
    if( ! gaBucket.last.even ) gaBucket.last.even = visitor.event.apply( visitor, args)
    else gaBucket.last.even = gaBucket.last.even.event.apply( visitor, args )
    // this will send all events every 5 secs (and not more often)  
    if( gaBucket.timeout.eventSend !== false ) clearTimeout( gaBucket.timeout.eventSend )
    gaBucket.timeout.eventSend = setTimeout( function(){
      gaBucket.last.even.send()
      gaBucket.timeout.eventSend = false
    }, process.env.GA_BUFFERTIME || 5000 )
  }

  return this

}.apply({})
