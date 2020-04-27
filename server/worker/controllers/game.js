const uuidv4 = require('uuid').v4; // for creation of guids
const redis = require('../asyncRedis.js');


// checks if an open game with the given settings exists. If not, creates one
async function GetGame(/* data */) {
  let gameURL;

  // get list of open games from redis
  const openGames = await redis.LRange('Open Games', 0, await redis.LLen('Open Games'));

  // among the open games, check for one that fits the client's request
  const game = openGames.find((gameName) => {
    redis.LRem('Open Games', 1, gameName); // prevent other players from connecting
    return true; // adjust in the future to handle game settings
  });

  // a suitable game was found among the openings
  if (game) {
    gameURL = `/game/${game}`;
  } else {
    // create a new game with the appropriate settings
    const gameID = uuidv4(); // produce an identifier for the game
    gameURL = `/game/${gameID}`;

    // push the new game data onto redis
    redis.LPush('Open Games', gameID);
    await redis.HSet(gameID, 'dummyKey', 'dummyValue');
  }

  return { gameURL };
}

module.exports.GetGame = GetGame;
