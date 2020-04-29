// manages controllers for websocket-based communications (as well as the websockets themselves)
// due to the persistent nature of websocket connections, this file must save state

const Queue = require('bull');
const redis = require('redis');
const uuidv4 = require('uuid').v4; // function for creation of guids

const REDIS_URL = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';

const redisClient = redis.createClient(REDIS_URL);
const eventQueue = new Queue('event', REDIS_URL);


// the websocket connections this server is maintaining, organized by rooms
// members of each room are websocket connections indexed by ID
const rooms = {};

// removes websocket connection from this server's address book
function RemoveClient(room, id) {
  delete rooms[room][id];

  // remove this connection from the game state
  eventQueue.add({ type: 'disconnect', data: { room, client: id } });

  // if room is now empty
  if (Object.keys(rooms[room]).length === 0 && rooms[room].constructor === Object) {
    delete rooms[room]; // delete the room too
  }
}

// helper function to set up client once their room is known to exist
function AddClient(room, websocket) {
  const client = websocket;

  const id = uuidv4();
  client.id = id;
  client.room = room;

  rooms[room][id] = client; // add the client to the room, indexed by their ID
  eventQueue.add({ type: 'join', data: { client: id, room } }); // let all in the room know that they've joined
  client.on('close', () => RemoveClient(room, id));
}

// adds websocket connection to the specified room (if it exists)
function AddToRoom(data, websocket) {
  const { room } = data;

  // exists since we already know about it
  if (rooms[room] !== undefined && rooms[room] !== null) {
    AddClient(room, websocket);
    return;
  }

  // this web node can't confirm the room, check redis storage (async)
  redisClient.EXISTS(room, (err, reply) => {
    if (err) {
      console.log(err);
    }

    // there is an entry for this room
    if (reply === 1) {
      rooms[room] = {}; // init this room so we can store clients
      AddClient(room, websocket);
    }
  });
}

// -----------------------------------handle ws messages from client--------------------------------

function TestText(data, client) {
  eventQueue.add({ type: 'text', data: { room: client.room, text: data.text } });
}

// response to ping received, schedule the next ping
function Pong(data, client) {
  if (client.room === undefined || client.id === undefined) {
    return;
  }
  eventQueue.add({ type: 'ping', data: { room: client.room, client: client.id } });
}


// -----------------------------------send ws messages to client------------------------------------

// job completed events are the mechanism through which workers trigger messages to the client
// jobs may set themselves to trigger messages by setting a target in their return value JSON
eventQueue.on('global:completed', (jobId, result) => {
  // filter out any jobs that don't trigger messages
  if (!result) {
    return;
  }

  const jobResults = JSON.parse(result);
  const targetRoom = rooms[jobResults.room];

  if (targetRoom) {
    const targetClient = rooms[jobResults.room][jobResults.client];

    if (jobResults.client === undefined) {
      // broadcast to whole room, no client specified
      Object.keys(targetRoom).forEach((id) => {
        targetRoom[id].send(JSON.stringify(jobResults.data));
      });

      eventQueue.getJob(jobId).then((job) => {
        job.remove();
      });
    } else if (targetClient !== undefined) {
      // broadcast to specific client (that this node knows of)
      targetClient.send(JSON.stringify(jobResults.data));

      eventQueue.getJob(jobId).then((job) => {
        job.remove();
      });
    }
  }
});


module.exports.AddToRoom = AddToRoom;
module.exports.TestText = TestText;
module.exports.Pong = Pong;
