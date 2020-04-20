// manages controllers for websocket-based communications (as well as the websockets themselves)
// due to the persistent nature of websocket connections, this file must save state

const Queue = require('bull');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const eventQueue = new Queue('event', REDIS_URL);


// the websocket connections this server is maintaining, indexed by ip
const clients = {};

// adds websocket connection to this server's address book
function AddClient(client, ip) {
  clients[ip] = client;
  eventQueue.add({ type: 'welcome', data: { client: ip } });
}

// removes websocket connection from this server's address book
function RemoveClient(ip) {
  delete clients[ip];
}


// job completed events are the mechanism through which workers trigger messages to the client
// jobs may set themselves to trigger messages by setting a target in their return value JSON
eventQueue.on('global:completed', (jobId, result) => {
  const jobResults = JSON.parse(result);
  const targetClient = clients[jobResults.target];

  if (targetClient) {
    console.log('sending message');
    targetClient.send(JSON.stringify(jobResults.data));
  }

  console.log(`Job ${jobId} completed with result ${result}`);
});


module.exports.AddClient = AddClient;
module.exports.RemoveClient = RemoveClient;
