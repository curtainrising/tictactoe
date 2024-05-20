var config = {
  local: {
    baseUrl : 'localhost',
  },
  dev: {
	  baseUrl : "dtictactoe-s.sammedalen.com",
  },
  production: {

	  baseUrl : "tictactoe-s.sammedalen.com",
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
