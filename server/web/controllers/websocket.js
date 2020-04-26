// manages controllers for websocket-based communications (as well as the websockets themselves)
// due to the persistent nature of websocket connections, this file must save state

const Queue = require('bull');
const redis = require('redis');
const uuidv4 = require('uuid').v4; // function for creation of guids

const REDIS_URL = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';

const redisClient = redis.createClient(REDIS_URL);
const eventQueue = new Queue('event', REDIS_URL);


// the websocket connections this server is maintaining, organized by rooms
// members of each room are websocket connections indexed by IP
const rooms = {};

// removes websocket connection from this server's address book
function RemoveClient(room, id) {
  delete rooms[room][id];

  // if room is now empty
  if (Object.keys(rooms[room]).length === 0 && rooms[room].constructor === Object) {
    delete rooms[room]; // delete the room too
  }
}

// adds websocket connection to the specified room (if it exists)
function AddToRoom(data, /* id, */ client) {
  const { room } = data;

  // called in the sync and async room validation contexts
  const AddClient = function () {
    const id = uuidv4();

    // break if this client has been added already
    if (rooms[room][id] !== undefined) {
      return;
    }

    rooms[room][id] = client; // add the client to the room, indexed by their ip
    eventQueue.add({ type: 'welcome', data: { id, room } }); // let all in the room know that they've joined
    client.on('close', () => RemoveClient(room, id));
  };

  // exists since we already know about it
  if (rooms[room] !== undefined && rooms[room] !== null) {
    AddClient();
    return;
  }

  // this web node can't confirm the room, check redis storage
  redisClient.get(`room${room}`, (err, reply) => {
    if (err) {
      console.log(err);
    }

    // there is an entry for this room, so it exists
    if (reply !== null) {
      rooms[room] = {}; // init this room so we can store clients
      AddClient();
    }
  });
}

function TestText(data) {
  eventQueue.add({ type: 'text', data: { room: data.room, text: data.text } });
}

// job completed events are the mechanism through which workers trigger messages to the client
// jobs may set themselves to trigger messages by setting a target in their return value JSON
eventQueue.on('global:completed', (jobId, result) => {
  const jobResults = JSON.parse(result);
  const targetRoom = rooms[jobResults.room];
  const targetClient = rooms[jobResults.room][jobResults.client];

  if (targetRoom) {
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
