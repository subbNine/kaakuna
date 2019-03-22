"use strict"

let http = require('http');
let fs = require('fs');

let server = http.createServer(function(req, res){
    let Url = req.url;
    if(Url === '/' || Url === '/home'){
        res.writeHead(200, {'Content-Type': 'text/html'});
        let readStream = fs.createReadStream(__dirname + '/www/index.html', 'utf8');
        readStream.pipe(res);
    }
    else if(Url === '/contact'){
        res.writeHead(200, {'Content-Type': 'text/html'});
        let readStream = fs.createReadStream(__dirname + '/www/contact.html', 'utf8');
        readStream.pipe(res);
    }
    else if(Url === '/api/user/id/4'){
        res.writeHead(200, {'Content-Type': 'application/json'});
        let user = {name: 'Prince Ita', age: 25, id: 4};
        res.write(JSON.stringify(user));
        res.end();
    }
    else{
        res.writeHead(404, {'Content-Type': 'text/html'});
        let readStream = fs.createReadStream(__dirname + '/www/404.html');
        readStream.pipe(res);
    }
});

server.listen(32000, '127.0.0.1', ()=> console.log('Listening for connection on port 32000'));