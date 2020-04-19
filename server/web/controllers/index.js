//aggregates the exports for this folder so only one require is needed

const Queue = require('bull');
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const eventQueue = new Queue('event', REDIS_URL);

async function AddTestJob(req, res)
{
    let job = await eventQueue.add({
        type: "log",
        data: {message: "test job processed"}
    });

    res.status(202).json({id: job.id});
}

// You can listen to global events to get notified when jobs are processed
eventQueue.on('global:completed', (jobId, result) => {
    console.log(`Job ${jobId} completed with result ${result}`);
  });

module.exports.AddTestJob = AddTestJob;