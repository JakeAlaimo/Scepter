const Account = require('../models/account.js');

// tries to log the client in based on the credentials provided
async function Login(data) {
  // force cast to strings to cover some security flaws
  const username = `${data.username}`;
  const password = `${data.password}`;

  if (!username || !password) {
    return { status: 400, data: { error: 'All fields are required.' } };
  }

  const account = await Account.AccountModel.Authenticate(username, password).exec();

  if (!account) {
    return { status: 401, data: { error: 'Wrong username or password.' } };
  }

  // TO-DO: add session support, use sessions with connect/disconnect/reconnect
  // req.session.account = Account.AccountModel.toAPI(account);
  return { status: 200, data: { success: 'Successfully logged in.' } };
}

// tries to add a new account to the database base on data provided
async function Signup(data) {
  // cast to strings to cover up some security flaws
  const username = `${data.username}`;
  const password = `${data.password}`;
  const password2 = `${data.password2}`;

  if (!username || !password || !password2) {
    return { status: 400, data: { error: 'All fields are required.' } };
  }
  if (password !== password2) {
    return { status: 400, data: { error: 'Passwords do not match.' } };
  }

  // password are hashed for security purposes
  const hashResults = await Account.AccountModel.GenerateHash(password);

  const accountData = {
    username,
    salt: hashResults.salt,
    password: hashResults.hash,
  };

  const newAccount = new Account.AccountModel(accountData);

  // TO-DO: use session to log user in
  // req.session.account = Account.AccountModel.toAPI(newAccount);

  try {
    await newAccount.save();
    return { status: 200, data: { success: 'Account successfully created.' } };
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return { status: 400, data: { error: 'Username already in use.' } };
    }
    return { status: 400, data: { error: 'An error occurred.' } };
  }
}

// const getToken = (request, response) => {
//   const req = request;
//   const res = response;

//   const csrfJSON = {
//     csrfToken: req.csrfToken(),
//   };

//   res.json(csrfJSON);
// };

module.exports.Login = Login;
module.exports.Signup = Signup;
