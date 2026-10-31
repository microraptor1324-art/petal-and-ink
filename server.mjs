import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('./dist/', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf','.woff2':'font/woff2','.json':'application/json' };
http.createServer(async (req,res) => {
 try {
  let pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/' || pathname==='/builder.html') pathname='/index.html';
  const filename=resolve(root, '.'+pathname);
  if(!filename.startsWith(root.endsWith(sep)?root:root+sep)){res.writeHead(403);res.end('Forbidden');return;}
  const data=await readFile(filename);
  res.writeHead(200,{'Content-Type':types[extname(filename)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(data);
 } catch {res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
