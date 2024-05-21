var config = {
  local: {
    baseUrl : 'localhost',
  },
  dev: {
	  baseUrl : "d-tic-api.yourdomain.com",
  },
  production: {

	  baseUrl : "tic-api.yourdomain.com",
  },
  common: {
    apiPort : 8082,
    passwordHashLength: 15,
    randomNumberString: "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUWX",
    currentPlayableGames : {
      "tictactoe": "tic tac toe"
    }
  }

};
