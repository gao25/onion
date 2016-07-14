exports.fn = function(req, res, pathname, ext) {
  var fs = require('fs'),
    filePath = hostPath + pathname,
    ext = pathname.substring(pathname.lastIndexOf('.')+1);
  // type字典
  var typeArray = {
    'html': 'text/html',
    'shtml': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'ico': 'image/x-icon',
    'json': 'text/json',
    'mp3': 'audio/mp3',
    'ogg': 'audio/ogg',
    '3gpp': 'video/3gpp',
    '3gp': 'video/3gpp',
    'mp4': 'video/mpeg4',
    'mpeg': 'video/mpg',
    'mpg': 'video/mpg',
    'mov': 'video/quicktime',
    'webm': 'video/webm',
    'flv': 'video/x-flv',
    'wmv': 'video/x-ms-wmv',
    'avi': 'video/x-msvideo'
  }
  // 解析显示
  var type = typeArray[ext] || 'application/octet-stream';
  fs.stat(filePath, function(err, stats){
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'});
      res.end('{ERROR:404:' + pathname + '}');
    } else {
      var mtime = stats.mtime.toUTCString();
      var age = 315360000;
      var expiresTime = new Date(mtime).getTime() + age * 1000;
      var expires = new Date(expiresTime).toUTCString();
      var headDict = {
        'Content-Type': type,
        'Content-Encoding': 'gzip',
        'Cache-Control': 'max-age=' + age,
        'Last-Modified': mtime,
        'Expires': expires
      }
      var mtimeSince = req.headers['if-modified-since'];
      if (mtimeSince && mtimeSince == mtime) {
        res.writeHead(304, 'Not Modified', headDict);
        res.end();
      } else {
        res.writeHead(200, 'OK', headDict);
        var zlib = require('zlib');
        var raw = fs.createReadStream(filePath);
        raw.pipe(zlib.createGzip()).pipe(res);
      }
    }
  });
};