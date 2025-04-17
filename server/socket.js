module.exports = function(io) {
    io.on('connection', socket => {
      console.log('New client connected');
  
      // Join user's room
      socket.on('join', userId => {
        socket.join(userId);
        console.log(`User ${userId} joined their room`);
      });
  
      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  };