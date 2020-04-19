//this files launches a clustered worker process without defining worker behavior

//workers perform background jobs independently to put less load on the web process
//they share a redis event queue that the web process adds on to
//performance can scale by adding more of them, so they are composed of independent functions

//it would make more sense to distinguish workers as distinct microservices, but
//I am limited to using one worker on the free heroku tier

const throng = require('throng');
const Queue = require("bull");
const HandleEvent = require('./handler.js');

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// Spin up multiple processes to handle jobs to take advantage of more CPU cores
const workers = process.env.WEB_CONCURRENCY || 1;
const maxJobsPerWorker = 50;

//the function 
function start() {
  // Connect to the event queue
  let eventQueue = new Queue('event', REDIS_URL);

  eventQueue.process(maxJobsPerWorker, HandleEvent);
}

// Initialize the clustered worker process
throng({ workers, start });