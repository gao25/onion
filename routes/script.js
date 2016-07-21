exports.fn = function(req, res, pathname, ext) {
  var fs = require('fs'),
    filePath = hostPath + pathname;
  fs.stat(filePath, function (error, stats){
    if (error) {
      res.writeHead(404, {'Content-Type': 'text/html'});
      res.end('{ERROR:404:' + pathname + '}');
    } else {
      fs.readFile(filePath, 'utf8', function (error, source){
        if (error) {
          res.writeHead(404, {'Content-Type': 'text/html'});
          res.end('{ERROR:404:' + pathname + '}');
        } else {
          var scriptMatch = require('./script_match');
          scriptMatch.includefn(source, function(source){
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.end(source);
          });
        }
      });
    }
  });
};