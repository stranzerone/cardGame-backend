const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  },
});

let rooms = {};

const dummyUsers = [
 

];


io.on('connection', (socket) => {

  socket.on('joinRoom', (roomId, username) => {
    if (!roomId || !username) {
      return;
    }

    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = [...dummyUsers];
    }

    const newUser = {
      id: socket.id,
      name: username,
      score:0,
    };

    rooms[roomId].push(newUser);
    io.to(roomId).emit('getUsers', rooms[roomId]);
  });

  socket.on('getUsers', (roomId) => {
    if (!roomId) {
      console.log('Invalid roomId');
      return;
    }

    if (rooms[roomId]) {
      io.to(roomId).emit('getUsers', rooms[roomId]);
    } else {
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');

    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(user => user.id !== socket.id);
      io.to(roomId).emit('getUsers', rooms[roomId]);
    }
  });

  socket.on('distributeCard', (roomId,first,callback) => {

    if (!roomId) {
      console.log('Invalid roomId');
      return;
    }

    if (!rooms[roomId]) {
      return;
    }

    if (rooms[roomId].length < 1) {
      return;
    }


    // Create a shuffled array of scores
    const scores = Array.from({ length: rooms[roomId].length }, (_, i) => i * 100); // [0, 100, 200, ..., 800]
    shuffleArray(scores);

    const userList = rooms[roomId].map((user, index) => ({
      id: user.id,
      name: user.name,
      score: scores[index] // Assign the shuffled score to each user
    }));

    io.to(roomId).emit('cardDistributed', userList);
    
    updateLeaderboard(userList,first,roomId); // Update leaderboard

    if (callback && typeof callback === 'function') {
      try {
        callback();
      } catch (error) {
        console.error('Error executing callback:', error);
      }
    }
  });

socket.on("choosen",(data)=>{
io.to(data.room).emit("getNew",data)



})




socket.on('updateLeaderboard', ({ data, room }) => {

  if (!room || !rooms[room]) {
    return;
  }

  // Merge scores from initial users with scores received in data
  const updatedScores = rooms[room].map(user => {
    const updatedUser = data.find(updated => updated.id === user.id);
    return {
      ...user,
      score: user.score + (updatedUser ? updatedUser.score : 0)
    };
  });

  rooms[room] = updatedScores;

  io.to(room).emit('leaderboardUpdated', updatedScores);
});


  socket.on("chor", (data) => {
    io.to(data.roomId).emit("receivedChor")
  });

  // Shuffle function to shuffle an array
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Function to update leaderboard
  const updateLeaderboard = (updatedLeaderboard,first,room) => {
    io.to(room).emit('leaderboardUpdated', updatedLeaderboard,first); // Emit event to update all connected clients
  };

});

const PORT = 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
