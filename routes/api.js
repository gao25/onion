exports.fn = function (req, res, pathname) {
  var fs = require('fs'),
    filePath = hostPath + '/api' + pathname.replace('.do', '.json');

  fs.stat(filePath, function (err, stats) {
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'});
      res.end('服务器错误，接口不存在');
    } else {
      fs.readFile(filePath, 'utf-8', function(err, source){
        if (err) {
          res.writeHead(404, {'Content-Type': 'text/html'});
          res.end('{ERROR:404:' + pathname + '}');
        } else {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(source);
        }
      });
    }
  });
};