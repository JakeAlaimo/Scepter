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
  return { room: data.room, client: data.client, data: { type: 'ping' } };
}


module.exports.Wait = Wait;
module.exports.Ping = Ping;
