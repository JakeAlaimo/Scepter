// Manages controllers for all standard http-based requests. Always client-driven

// import { v4 as uuidv4 } from 'uuid'; //method for generating unique identifiers

const Queue = require('bull');

const REDIS_URL = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';

const eventQueue = new Queue('event', REDIS_URL);

// Helper function to shift an event onto the queue
// Ensures the job id is always sent to the client (needed for polling)
async function AddEvent(res, eventData) {
  const job = await eventQueue.add(eventData);
  res.status(202).json({ id: job.id });
}

// notifies the client whether the app is running locally
// for setting up websocket addr appropriately on the client
function IsTestBuild(req, res) {
  res.status(200).json({ isLocal: process.env.NODE_ENV !== 'production' });
}

// loads up the game screen
function LoadGame(req, res) {
  res.render('game', { id: req.params.id });
}


// look for (or create) a game matching the provided settings
async function RequestGame(req, res) {
  const event = {
    type: 'game requested',
    data: { public: req.body.public },
  };

  AddEvent(res, event);
}

async function AddTestJob(req, res) {
  const event = {
    type: 'log',
    data: { message: 'test job processed' },
  };

  AddEvent(res, event);
}

// exposes functionality for the client to check on the results of a specific job
// when the server adds a job to the queue, it always responds with the job's id
// NOTE: jobs don't track who requested them, enure they never return sensitive data
async function PollJob(req, res) {
  const { id } = req.params;
  const job = await eventQueue.getJob(id);

  // requested job not available, possibly cleared
  if (job === null) {
    res.status(404).end(); // not likely a bad request, client might want to request job again
    return;
  }

  // the job has not yet finished
  if (job.finishedOn === null) {
    // notify the client the job is ongoing. If applicable, communicate progress
    res.status(202).json({ id: job.id, progress: job._progress });
  } else {
    // job finished, send its data
    const result = job.returnvalue;
    const reason = job.failedReason;
    res.status(result.status).json({ id, result: result.data, reason });

    // now that the data has been retrieved, remove this job from the queue
    job.remove();
  }
}


module.exports.LoadGame = LoadGame;
module.exports.IsTestBuild = IsTestBuild;
module.exports.RequestGame = RequestGame;
module.exports.AddTestJob = AddTestJob;

module.exports.PollJob = PollJob;
