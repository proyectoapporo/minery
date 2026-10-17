import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {handler} from './netlify/functions/quote.mjs';
import {handler as assistant} from './netlify/functions/assistant.mjs';
const root=path.resolve(fileURLToPath(new URL('./public/',import.meta.url)));
const port=Number(process.env.PORT)||4174;
http.createServer(async(req,res)=>{
 try {
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(['/api/assistant','/.netlify/functions/assistant'].includes(pathname)){let body='';for await(const chunk of req){body+=chunk.toString();if(Buffer.byteLength(body)>12000){res.writeHead(413);res.end('Mensaje demasiado largo');return}}const r=await assistant({httpMethod:req.method,headers:req.headers,body});res.writeHead(r.statusCode,r.headers);res.end(r.body);return}
  if(pathname==='/api/quote'){const r=await handler({httpMethod:req.method});res.writeHead(r.statusCode,r.headers);res.end(r.body);return}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return}
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep))throw Error();
  const body=await readFile(file);
  res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});
  res.end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(404);res.end('No encontrado')}
}).listen(port,'127.0.0.1',()=>console.log(`Minery: http://127.0.0.1:${port}`));
