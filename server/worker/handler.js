// launches the appropriate background process based on event type

const controllers = require('./controllers');

// maps the event type to the work to be done as result of it
const work = {
  log: (data) => { console.log(data.message); },
  join: controllers.maintenance.JoinRoom,
  ping: controllers.maintenance.Ping,
  text: (data) => ({ room: data.room, data: { type: 'log', message: data.text } }),

};

async function Handle(job) {
  const event = job.data;
  const BackgroundProcess = work[event.type];

  const result = BackgroundProcess(event.data);

  return result;
}

module.exports = Handle;
