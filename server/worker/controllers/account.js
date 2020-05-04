const Account = require('../models/account.js');

// ensures that all the necessary data is provided and valid
function ValidateInput(data, context) {
  // cast to strings to cover up some security flaws
  const input = {
    username: `${data.username}`,
    password: `${data.password}`,
    password2: `${data.password2}`,
    newPassword: `${data.newPassword}`,
    newPassword2: `${data.newPassword2}`,
  };

  if (!data.username || !data.password || (context === 'signup' && !data.password2)
     || (context === 'changePassword' && (!data.newPassword || !data.newPassword2))) {
    input.error = { status: 400, data: { error: 'All fields are required.' } };
  } else if (context === 'signup' && input.password !== input.password2) {
    input.error = { status: 400, data: { error: 'Passwords do not match.' } };
  } else if (input.newPassword !== input.newPassword2) {
    input.error = { status: 400, data: { error: 'New passwords do not match.' } };
  }

  return input;
}

// tries to log the client in based on the credentials provided
async function Login(data) {
  const input = ValidateInput(data);

  if (input.error) {
    return input.error;
  }

  const account = await Account.AccountModel.Authenticate(input.username, input.password);
  if (!account) {
    return { status: 401, data: { error: 'Wrong username or password.' } };
  }


  const accountSession = Account.AccountModel.toAPI(account);
  return { status: 200, account: accountSession, data: { success: 'Successfully logged in.' } };
}

// tries to add a new account to the database base on data provided
async function Signup(data) {
  const input = ValidateInput(data, 'signup');

  if (input.error) {
    return input.error;
  }

  // password are hashed for security purposes
  const hashResults = await Account.AccountModel.GenerateHash(input.password);

  const accountData = {
    username: input.username,
    salt: hashResults.salt,
    password: hashResults.hash,
  };

  const newAccount = new Account.AccountModel(accountData);

  const accountSession = Account.AccountModel.toAPI(newAccount);

  return newAccount.save().then(() => ({ status: 200, account: accountSession, data: { success: 'Account successfully created.' } }))
    .catch((err) => {
      console.log(err);
      if (err.code === 11000) {
        return { status: 400, data: { error: 'Username already in use.' } };
      }
      return { status: 400, data: { error: 'An error occurred.' } };
    });
}

// Updates existing doc if given the appropriate credentials
async function ChangePassword(data) {
  const input = ValidateInput(data, 'changePassword');

  if (input.error) {
    return input.error;
  }

  const account = await Account.AccountModel.Authenticate(input.username, input.password);
  if (!account) {
    return { status: 401, data: { error: 'Wrong username or password.' } };
  }

  // hash new password
  const hashResults = await Account.AccountModel.GenerateHash(input.newPassword);

  // update password data
  account.salt = hashResults.salt;
  account.password = hashResults.hash;
  return account.save().then(() => ({ status: 200, data: { success: 'Password successfully updated.' } }))
    .catch(() => ({ status: 400, data: { error: 'Password failed to update.' } }));
}


async function AddWin(data) {
  let username = `${data.username}`;

  const account = await Account.AccountModel.FindByUsername(username);
  if (!account) {
    return; //wrong username
  }

  account.wins += 1;
  account.save();
}
async function AddLoss(data) {
    let username = `${data.username}`;
  
    const account = await Account.AccountModel.FindByUsername(username);
    if (!account) {
      return; //wrong username
    }
  
    account.losses += 1;
    account.save();
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
module.exports.ChangePassword = ChangePassword;

module.exports.AddWin = AddWin;
module.exports.AddLoss = AddLoss;


