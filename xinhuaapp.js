var port = 6802,
  http = require('http'),
  server = new http.Server();
server.on('request', function(req, res) {
  global.hostPath = __dirname + '/template/xinhuaapp';

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
  } else if (ext == 'css') {
    var routes = require('./routes/style');
  } else if (ext == 'do') {
    var routes = require('./routes/api');
  } else {
    var routes = require('./routes/static');
  }
  routes.fn(req, res, pathname, ext);
});
server.listen(port, function(){
  console.log('xinhuaapp 启动成功 \\ 端口号:'+port);
});
