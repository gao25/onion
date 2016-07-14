exports.fn = function(req, res, pathname) {
  // 文件路径
  var filePath = viewPath + pathname;
  // 辨别接口是否存在
  try{
    var apiRoutes = require(filePath);
  } catch(error) {
    var apiRoutes = null;
  }
  if (apiRoutes) {
    var request = require('./request'),
      req_get = request.get(req),
      req_cookie = request.cookie(req);
    // 获取post数据
    var formidable = require('formidable');
    var formIn = new formidable.IncomingForm();
    formIn.parse(req, function(err, req_post, req_files) {
      if (err) {
        res.writeHead(403, {'Content-Type': 'text/html'});
        res.end('服务器错误，数据处理失败');
      } else {
        apiRoutes.fn({'get':req_get,'post':req_post,'files':req_files,'cookie':req_cookie}, function(resData, resCookie){
          // 设置cookie
          if (resCookie) {
            res.setHeader("Set-Cookie", resCookie);
          }
          if (resData['type'] == 'json') {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(resData['json']));
          } else if (resData['type'] == 'jsonp') {
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.end(resData['jsonp']);
          } else {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(resData['source']);
          }
        });
      }
    });
  } else {
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.end('服务器错误，接口不存在');
  }
};