const uuidv4 = require('uuid').v4; // for creation of guids
const redis = require('../asyncRedis.js');

// if no players are connected, clean up the game room
async function CloseGame(gameID, ms) {
  const interval = setInterval(async () => {
    const connections = await redis.HGet(gameID, 'NumConnected');

    if (connections <= 0) {
      redis.Del(gameID); // delete this game room outright

      // remove from lists if necessary
      redis.LRem('Open Games', 1, gameID);
      clearInterval(interval);
    }
  }, ms);
}

// sets up a new game instance with all of the necessary game state
async function CreateGame(settings) {
  const gameID = uuidv4(); // produce an identifier for the game

  // configure all of the game settings
  const settingsFormatted = []; //will store settings in the format '[key1, val1, ...]'
  Object.entries(settings).forEach((keyVal) => settingsFormatted.push(keyVal[0], keyVal[1]));
  await redis.HMSet(gameID, settingsFormatted);

  // now set initial game state
  await redis.HMSet(gameID, 'NumPlayers', 0);
  await redis.HSet(gameID, 'NumConnected', 0);

  // optionally, push the game onto the public list
  if (settings.public === true) {
    redis.LPush('Open Games', gameID);
  }

  CloseGame(gameID, 6000000); // close the game room when empty

  return gameID;
}

// after an interval, reopen the game if the 2nd player hasn't connected
async function ReopenGame(gameID, ms) {
  setTimeout(async () => {
    const numPlayers = await redis.HGet(gameID, 'NumPlayers');

    if (numPlayers < 2) {
      redis.LPush('Open Games', gameID);
    }
  }, ms);
}

// checks if an open game with the given settings exists. If not, creates one
async function GetGame(data) {
  // player is requesting a public match
  if (data.public === true) {
    // get list of open games from redis
    const openGames = await redis.LRange('Open Games', 0, await redis.LLen('Open Games'));

    // among the open games, check for one that fits the client's request
    const game = openGames.find((gameName) => {
      redis.LRem('Open Games', 1, gameName); // prevent other players from connecting
      ReopenGame(gameName, 10000); // place this back in the open list if nobody connects
      return true; // adjust in the future to handle game settings
    });

    // a suitable game was found among the openings
    if (game) {
      return { gameURL: `/game/${game}` };
    }
  }

  // no public game suitable, create a new one
  const gameID = await CreateGame(data);
  return { gameURL: `/game/${gameID}` };
}


module.exports.GetGame = GetGame;
