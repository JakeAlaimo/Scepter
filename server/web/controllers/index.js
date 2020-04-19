//aggregates the exports for this folder so only one require is needed

const Queue = require('bull');
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const eventQueue = new Queue('event', REDIS_URL);

//Helper function to shift an event onto the queue
//Ensures the job id is always sent to the client (needed for polling)
async function AddEvent(res, eventData)
{
    let job = await eventQueue.add(eventData);
    res.status(202).json({id: job.id});
}

async function AddTestJob(req, res)
{
    let event = {
        type: "log",
        data: {message: "test job processed"}
    };

    AddEvent(res, event);
}

//exposes functionality for the client to check on the results of a specific job
//when the server adds a job to the queue, it always responds with the job's id
//NOTE: jobs don't track who requested them, enure they never return sensitive data
async function PollJob(req, res)
{
    let id = req.params.id;
    let job = await eventQueue.getJob(id);
  
    if (job === null) //requested job not available, possibly cleared
    {
        res.status(404).end(); //not likely a bad request, client might want to request job again
    } 
    else
    {
        if(job.finishedOn === null) //the job has not yet finished
        {
            //notify the client the job is ongoing. If applicable, communicate progress
            res.status(202).json({id: job.id, progress: job._progress});
        }
        else //job finished, send its data
        {
            let result = job.returnvalue;
            let reason = job.failedReason;
            res.status(200).json({ id, result, reason });

            //now that the data has been retrieved, remove this job from the queue
            job.remove();
        }
    }
}

// You can listen to global events to get notified when jobs are processed
eventQueue.on('global:completed', (jobId, result) => {
    console.log(`Job ${jobId} completed with result ${result}`);
  });

module.exports.AddTestJob = AddTestJob;
module.exports.PollJob = PollJob;