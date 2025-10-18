const http = require('http').createServer();

const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

io.on('connection', (socket) => {
    console.log('user connected');

    socket.on('message'/*use any event name */, (message) => {
        console.log('user connected');

        io.emit('message', `${socket.id.substr(0,2)} said ${message}`)
    });
})

http.listen(8080, () => console.log('listening on http://localhost:8080'))