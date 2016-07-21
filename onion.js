exports.fn = function(dirname, port) {
  var http = require('http'),
    server = new http.Server();
  server.on('request', function(req, res) {
    global.commonPath = __dirname + '/template/onion_common';
    global.hostPath = __dirname + '/template/'+dirname;

    var url = require('url');
    // 解析路径
    var ext = 'html',
      pathname = url.parse(req.url)['pathname'];
    if (pathname == '/') {
      pathname += 'index.html';
    } else {
      if (pathname.indexOf('.') < 0) {
        pathname += '/index.html';
        pathname = pathname.replace(/\/\//g, '/');
      } else {
        ext = pathname.substring(pathname.lastIndexOf('.')+1);
      }
    }

    // 处理加载地址
    if (ext == 'html') {
      var routes = require('./routes/screen');
    } else if (ext == 'do') {
      var routes = require('./routes/api');
    } else if (ext == 'css') {
      var routes = require('./routes/style');
    } else if (ext == 'js') {
      var routes = require('./routes/script');
    } else {
      var routes = require('./routes/static');
    }
    routes.fn(req, res, pathname, ext);
  });
  server.listen(port, function(){
    console.log('onion '+dirname+' 启动成功 \\ 端口号:'+port);
  });
}
