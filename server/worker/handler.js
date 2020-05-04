// launches the appropriate background process based on event type

const controllers = require('./controllers');

// maps the event type to the work to be done as result of it
const work = {
  // ws
  join: controllers.game.JoinGame,
  disconnect: controllers.game.LeaveGame,
  ping: controllers.utility.Ping,
  text: (data) => ({ room: data.room, data: { type: 'chat', message: data.text } }),

  // non-ws
  log: (data) => { console.log(data.message); },
  login: controllers.account.Login,
  signup: controllers.account.Signup,
  changePassword: controllers.account.ChangePassword,
  'game requested': controllers.game.GetGame,
  sortBy: controllers.account.SortBy,


  // no response
  win: controllers.account.AddWin,
  loss: controllers.account.AddLoss,
};

async function Handle(job) {
  const event = job.data;
  const BackgroundProcess = work[event.type];

  const result = BackgroundProcess(event.data);

  return result;
}

module.exports = Handle;
