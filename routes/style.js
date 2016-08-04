exports.fn = function(req, res, pathname, ext) {
  var styleMatch = require('./style_match'),
    dateformat = require('./dateformat'),
    timestamp = dateformat.format('YYMMDDhhmmss');
  styleMatch.fn(pathname, function(source){
    source = source.replace(/\{\{\#timestamp\}\}/gi, timestamp);
    res.writeHead(200, {'Content-Type': 'text/css'});
    res.end(source);
  });
};