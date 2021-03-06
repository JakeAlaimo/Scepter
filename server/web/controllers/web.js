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

// incorrect file requested
function FileNotFound(req, res) {
  res.render('404');
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

// returns leaderboard page sorted by (and, optionally, limited to)
async function GetLeaderboard(req, res) {
  const event = {
    type: 'sortBy',
    data: {
      attr: req.body.attr,
      offset: req.body.offset,
      limit: req.body.limit,
    },
  };

  AddEvent(res, event);
}

// account creation/login functions below
// note that the client must poll these jobs to see if they've succeeded
function Login(req, res) {
  const event = {
    type: 'login',
    data: {
      username: req.body.username,
      password: req.body.password,
    },
  };

  AddEvent(res, event);
}
function Signup(req, res) {
  const event = {
    type: 'signup',
    data: {
      username: req.body.username,
      password: req.body.password,
      password2: req.body.password2,
    },
  };

  AddEvent(res, event);
}
function ChangePassword(req, res) {
  const event = {
    type: 'changePassword',
    data: {
      username: req.body.username,
      password: req.body.password,
      newPassword: req.body.newPassword,
      newPassword2: req.body.newPassword2,
    },
  };

  AddEvent(res, event);
}

// Destroys the session, which should carry over to ws connections as well
function Logout(req, res) {
  req.session.destroy();
  res.status(200).json({ message: 'Successfully logged out.' });
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
  if (!job.finishedOn) {
    // notify the client the job is ongoing. If applicable, communicate progress
    res.status(202).json({ id: job.id, progress: job._progress });
  } else {
    // job finished, send its data
    const result = job.returnvalue;
    const failed = job.failedReason;

    if (failed) {
      console.log(failed); // log fail reason, but don't pass it to the user
      res.status(400).json({ id, error: 'Job failed to complete.' });
    } else {
      if (result.account) { // log the user in if account session is given
        req.session.account = result.account;
      }
      res.status(result.status).json({ id, result: result.data });
    }

    // now that the data has been retrieved, remove this job from the queue
    job.remove();
  }
}


module.exports.LoadGame = LoadGame;
module.exports.IsTestBuild = IsTestBuild;
module.exports.RequestGame = RequestGame;
module.exports.FileNotFound = FileNotFound;

module.exports.AddTestJob = AddTestJob;

module.exports.GetLeaderboard = GetLeaderboard;


module.exports.Login = Login;
module.exports.Signup = Signup;
module.exports.ChangePassword = ChangePassword;
module.exports.Logout = Logout;


module.exports.PollJob = PollJob;
