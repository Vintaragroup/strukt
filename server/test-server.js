import http from 'http';

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok' }));
});

server.listen(5050, '127.0.0.1', () => {
  console.log('Test server listening on port 5050');
});
