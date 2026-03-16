import fs from "fs"
import path from 'path';
import http from 'http'
import process from "process";
import url from 'url';
import multiparty from'multiparty';
import {exec} from 'child_process'

const port = 5305;
const directoryPath = process.argv[2]||process.cwd();

function getSafeFilePath(baseDir, requestPath) {
  const normalized = path.normalize(requestPath)
  const fullPath = path.resolve(baseDir, './'+normalized);
  // console.log("safe path",normalized,fullPath)
  return fullPath.startsWith(baseDir + path.sep) || fullPath === baseDir?fullPath:null;
}

const TYPE_MINE={
  '.html':'text/html',
  '.css':'text/css',
  '.js':'application/javascript',
  '.json': 'application/json',
}

http.createServer((req, res) => {
  var u=url.parse(req.url)
  // var filePath = path.join(directoryPath, u.pathname === '/' ? 'SCAST.html' : u.pathname);
  var filePath = getSafeFilePath(directoryPath, u.pathname === '/' ? 'SCAST.html' : u.pathname);
  if(u.pathname=='/rawtext'){
    filePath=getSafeFilePath(directoryPath,u.query.replace('file=',''))
  }
  if(u.pathname=='/save'&&req.method=='POST'){
    var form=new multiparty.Form();
    form.parse(req,function(err,fields,files){
      console.log('save',fields.file)
      try{
        filePath=getSafeFilePath(directoryPath,fields.file[0])
        console.log('save file to',filePath)
        if(filePath!=null){
          fs.writeFileSync(filePath,fields.content[0])
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          return res.end('save ok');
        }else{
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          return res.end('403 Forbidden');
        }
      }catch(err){
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('save file error');
      }
    })
    return
  }
  console.log(u.pathname,u.query,filePath)
  if(filePath==null){
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
    } else {
      const extname = String(path.extname(filePath)).toLowerCase();
      let contentType = TYPE_MINE[extname]||'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
  
  
}).listen(port, () => {
  console.log(`SCAST Server is running on http://localhost:${port}`);
  console.log('directoryPath',directoryPath);
  // exec(`start http://localhost:${port}`) // auto open in browser but mcp first open will open twice
});