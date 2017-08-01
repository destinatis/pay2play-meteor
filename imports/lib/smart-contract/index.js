const interfaces = require('./interfaces.js');

function Registrar(web3, address, callback) {
  this.web3 = web3;

  // prior to version 0.16, web3.sha3 didn't prepend '0x', to support both options
  // here we attach a sha3 method to the registrar object, and ensure that it
  // always prepends '0x'
  this.sha3 = function sha3withZeroX(...args) {
    const result = web3.sha3.apply(this, args);
    if (result[1] !== 'x') {
      return `0x${result}`;
    }
    return result;
  };

  const thisRegistrar = this;

  this.contract = new this.web3.eth.Contract(interfaces.registrarInterface);
  this.contract.options.address = address;

  // this.contract = this.web3.eth.contract(interfaces.pay2playInterface).at(address);
  // this.contract = this.contract.registrar;

  this.contract.methods.registrarStartDate().call({
  }, function(error, result){
    thisRegistrar.registrarStartDate = result;
    callback(error, result);
  });

  this.contract.methods.node().call({
  }, function(error, result){
    thisRegistrar.node = result;
    callback(error, result);
  });
}

Registrar.prototype.createWagerAndDeposit = function createWagerAndDeposit(rulesHash, params = {}, callback = null) {

  console.log("createWagerAndDeposit");
  console.log(rulesHash);
  console.log(params);

  // this.contract.methods.createWagerAndDeposit().call(params, callback);

  this.contract.methods.createWagerAndDeposit(rulesHash).send(params, callback);

  // this.contract.methods.createWagerAndDeposit().send(params)
  // .on('transactionHash', function(hash){
  //   callback(null, hash);
  // })
  // // .on('receipt', function(receipt) {
  // //
  // // })
  // .on('confirmation', function(confirmationNumber, receipt) {
  //   callback(confirmationNumber, receipt);
  // })
  // .on('error', function(error) {
  //   console.error(error);
  //   callback(error);
  // });

};
Registrar.prototype.counterWagerAndDeposit = function counterWagerAndDeposit(index, params = {}, callback = null) {

  console.log("counterWagerAndDeposit");

  console.log(index);
  console.log(params);

  // this.contract.counterWagerAndDeposit(index, params, callback);
  // this.contract.methods.counterWagerAndDeposit(index).call(params, callback);

  this.contract.methods.counterWagerAndDeposit(index).send(params, callback);

  // this.contract.methods.counterWagerAndDeposit(index).send(params)
  // .on('transactionHash', function(hash){
  //   callback(null, hash);
  // })
  // .on('receipt', function(receipt) {
  //
  // })
  // .on('confirmation', function(confirmationNumber, receipt) {
  //
  // })
  // .on('error', function(error) {
  //   console.error(error);
  //   callback(error, null);
  // });
};
Registrar.prototype.setWagerWinner = function setWagerWinner(index, winner, params = {}, callback = null) {
  console.log("setWagerWinner");

  console.log(index);
  console.log(winner);

  // this.contract.setWagerWinner(index, winner, params, callback);
  // this.contract.methods.setWagerWinner(index, winner).call(params, callback);

  this.contract.methods.setWagerWinner(index, winner).send(params, callback);

  // this.contract.methods.setWagerWinner(index, winner).send(params)
  // .on('transactionHash', function(hash){
  //   callback(null, hash);
  // })
  // .on('receipt', function(receipt) {
  //
  // })
  // .on('confirmation', function(confirmationNumber, receipt) {
  //
  // })
  // .on('error', function(error) {
  //   console.error(error);
  //   callback(error, null);
  // });
};
Registrar.prototype.withdrawWinnings = function withdrawWinnings(index, params = {}, callback = null) {

  console.log("withdrawWinnings");

  console.log(index);
  console.log(params);

  // this.contract.withdrawWinnings(index, params, callback);
  // this.contract.methods.withdrawWinnings(index).call(params, callback);

  this.contract.methods.withdrawWinnings(index).send(params, callback);

  // this.contract.methods.setWagerWinner(index).send(params)
  // .on('transactionHash', function(hash){
  //   callback(null, hash);
  // })
  // .on('receipt', function(receipt) {
  //
  // })
  // .on('confirmation', function(confirmationNumber, receipt) {
  //
  // })
  // .on('error', function(error) {
  //   console.error(error);
  //   callback(error, null);
  // });
};
Registrar.prototype.getWager = function getWager(index, callback) {
  this.contract.methods.getWager(index).call({
  }, function(error, result){
    callback(error, result);
  });
};
Registrar.prototype.getWagerCount = function getWagerCount(callback) {
  this.contract.methods.getWagerCount().call({
  }, function(error, result){
    callback(error, result);
  });
};

module.exports = Registrar;
