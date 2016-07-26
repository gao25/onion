exports.fn = function(req, res, pathname, ext) {
  var styleMatch = require('./style_match');
  styleMatch.fn(pathname, function(source){
    res.writeHead(200, {'Content-Type': 'text/css'});
    res.end(source);
  });
};