//

// general utility for blocking for set # of ms
function Wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Keeps websockets alive by sending dummy data
async function Ping(data) {
  // ping within 55 seconds to prevent timeout on heroku
  await Wait(40000);
  // return value tells the web node to send the ping
  return { room: data.room, client: data.id, data: { type: 'ping' } };
}

// logs a welcome message and sets the first ping
function JoinRoom(data) {
  console.log(`${data.id} has joined room ${data.room}. Hi!`);
  return Ping(data);
}


module.exports.JoinRoom = JoinRoom;
module.exports.Ping = Ping;
