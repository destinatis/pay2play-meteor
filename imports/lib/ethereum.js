import Registrar from './smart-contract';

export let registrar;
export let network;
export let registrarAddress;
// export let web3;

import Web3 from './web3.min.js';

export let errors = {
  invalidNetwork: new Error('Sorry, Contribute is not available on this network at the moment.')
}

let networkId;

export default ethereum = (function() {
  let subscribers = [];
  let customRegistrarAddress;
  let publishedAtBlock;

  function initWeb3() {
    return new Promise((resolve, reject) => {
      if(typeof web3 !== 'undefined') {
        web3 = new Web3(web3.currentProvider);
        LocalStore.set('hasNode', true);
      } else {
        // let Web3 = require('web3');
        web3 = new Web3(Web3.givenProvider);
        // web3.bzz.setProvider("http://localhost:8500");

        // var bzz = web3.bzz;

        web3.bzz.setProvider("http://localhost:8500");
        // bzz.setProvider("http://swarm-gateways.net");

        // web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/NEefAs8cNxYfiJsYCQjc"));
        // web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/NEefAs8cNxYfiJsYCQjc"));
        LocalStore.set('hasNode', false);
      }
      resolve();
    })
  }
  function checkConnection() {
    reportStatus('Checking connection...')

    let attempts = 4,
    checkInterval;

    return new Promise((resolve, reject) => {
      function check() {
        attempts--;

        if(web3.eth.currentProvider.isConnected()) {

          clearInterval(checkInterval)
          resolve(web3);
        } else if (attempts <= 0) {
          console.log('checking..');
          reportStatus('Ethereum network is disconnected. Awaiting connection...');
        }
      }
      checkInterval = setInterval(check, 800);
      check();
    });
  }
  function checkNetwork() {
    return new Promise((resolve, reject) => {
      web3.eth.getBlock(0, function(e, res) {
        if (e) {
          return reject(e)
        }

        console.log('checkNetwork', res.hash)

        networkId = res.hash.slice(2,8);

        switch(res.hash) {
          case '0x41941023680923e0fe4d74a34bdac8141f2540e3ae90623718e47d66d1ca4a2d':
            network='ropsten';
            registrarAddress='0xdccd2a82cea71049b76c3824338f9af65f6515db';
            publishedAtBlock = 25409;
            resolve();
            break;
          case '0x0cd786a2425d16f152c658316c423e6ce1181e15c3295826d7c9904cba9ce303':
            network='morden';
            reject(errors.invalidNetwork);
            break;
          case '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3':
            network='main';
            registrarAddress='0x314159265dd8dbb310642f98f50c066173c1259b';
            publishedAtBlock = 3605331;
            resolve();
            break;
          default:
            network='private';
            reject(errors.invalidNetwork);
        }
      });
    })
  }
  function initRegistrar() {
    reportStatus('Initializing Smart Contract Registrar...');
    return new Promise((resolve, reject) => {
      try {
        registrar = new Registrar(web3, registrarAddress, (err, result) => {
          if (err) {
            return reject(err);
          }
          //TODO: Check that the registrar is correctly instanciated
          console.log('done initializing', err, result)
          resolve();
        });
      } catch(e) {
        reject('Error initialiting Smart Contract Registrar: ' + e);
      }
    });
  }
  function reportStatus(description, isReady, theresAnError) {
    subscribers.forEach((subscriber) => subscriber({
      isReady,
      description,
      theresAnError
    }));
  }
  function watchDisconnect() {
    function check() {
      if(web3.eth.currentProvider.isConnected()) {
        setTimeout(check, 2500);
      } else {
        initEthereum();
      }
    }

    return new Promise((resolve, reject) => {
      check();
      resolve();
    })
  }
  function initEthereum() {
    reportStatus('Connecting to Ethereum network...');

    return initWeb3()
      .then(checkConnection)
      .then(watchDisconnect)
      .then(checkNetwork)
      .catch(err => {
        if (err !== errors.invalidNetwork || !customEnsAddress) {
          console.log("error");
          throw err;
        }
      })
      .then(initRegistrar)
      .then(() => {
        reportStatus('Ready!', true);

        return new Promise((resolve, reject) => {
          // check();
          resolve();
        })
      })
      .catch(err => {
        console.error(err);
        reportStatus(err, false, true);
      })
  }
  function updateMistMenu() {

    if (typeof mist !== 'undefined' && mist && mist.menu) {
        var names = Names.find({mode: {$in: ['auction', 'reveal']}, watched: true}, {sort: {registrationDate: 1}}).fetch();
        mist.menu.clear();
        mist.menu.setBadge('');

        _.each(names, function(e,i){
            if (e.mode == 'auction') {
                var m =  moment(e.registrationDate * 1000 - 48*60*60*1000);
                var badge = m.fromNow(true);
            } else {
                if ( MyBids.find({name: e.name, revealed: { $not: true }}).count() > 0) {
                    var badge = 'Reveal now!';
                    mist.menu.setBadge('Some bids to expire soon');
                }
            }

            mist.menu.add(e._id, {
                name: e.fullname,
                badge: badge,
                position: i
            }, function(){
                // console.log('click menu', e);
                Session.set('searched', e.name);
            })
        })
    }
  }
  function updateRevealNames() {
      var cutoutDate = Math.floor(Date.now()/1000) + 48*60*60;
      var now = Math.floor(Date.now()/1000);
      // keep updating
      var names = Names.find({$or:[
          // any name I'm watching that is still on auction
          {registrationDate: {$gt: Math.floor(Date.now()/1000), $lt: cutoutDate}, name:{$gt: ''}, watched: true},
          // any name whose registration date has passed and isn't finalized
          {mode: {$nin: ['open', 'owned', 'forbidden']}, registrationDate: {$lt: now}, name:{$gt: ''}},
          // any name that is open or should be open by now
          {mode: {$in: ['open', 'not-yet-available']}, availableDate: {$lt: now}, name:{$gt: ''}},
          // any name that I don't know the mode
          {mode: {$exists: false}, name:{$gt: ''}}
          ]}, {limit:100}).fetch();

      console.log('update Reveal Names: ', _.pluck(names, 'name').join(', '));

      _.each(names, function(e, i) {
          registrar.getEntry(e.name, (err, entry) => {
          if(!err && entry) {
              Names.upsert({name: e.name}, {$set: {
                  mode: entry.mode,
                  value: entry.mode == 'owned' ? Number(web3.fromWei(entry.deed.balance.toFixed(), 'ether')) : 0,
                  highestBid: entry.highestBid,
                  registrationDate: entry.registrationDate
                }});
          }})
      })


      // Clean up Pending Bids
      _.each(PendingBids.find().fetch(), ( bid, i) => {
        // check for duplicates
        var dupBid = MyBids.find({shaBid:bid.shaBid}).fetch();
        if (dupBid && dupBid.shaBid == bid.shaBid && dupBid.secret == bid.secret){
            console.log('removing duplicate bid for', bid.name)
            PendingBids.remove({_id: bid._id});
        } else {
          registrar.contract.sealedBids.call(bid.owner, bid.shaBid, (err, result) => {
            if (err) {
              console.log('Error looking for bid', bid.name, err);
            } else if (result !== '0x0000000000000000000000000000000000000000') {
              console.log('Insert bid', bid.name);
              //bid successfully submitted
              MyBids.insert(bid);
              PendingBids.remove({_id: bid._id});
            } else {
              // Check for pending bids that are too late
              var name = Names.findOne({name: bid.name});
              var lastDay = Math.floor(new Date().getTime()) - (24 * 60 * 60 + 10 * 60) * 1000;

              if (name && name.mode == 'owned') {
                console.log('Pending bid for', bid.name, 'has been removed because name is', name.mode);
                PendingBids.remove({_id: bid._id});
              } else if (bid.date < lastDay) {
                console.log('A pending bid for', bid.name, 'is older than 24h and will be removed');
                PendingBids.remove({_id: bid._id});
              }
            }
          })
        }
      })

      updateMistMenu();
  }
  return {
    init: initEthereum,
    // updateMistMenu,
    // updateRevealNames,
    onStatusChange(callback) {
      subscribers.push(callback);
    },
    setCustomContract(registrarAddress) {
      customRegistrarAddress = registrarAddress;
    }
  };
}());

// export function connect(callback) {
//   var web3;
//
//   if(typeof web3 !== 'undefined') {
//     web3 = new Web3(web3.currentProvider);
//
//     LocalStore.set('hasNode', true);
//   } else {
//     let Web3 = require('web3');
//     // web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
//     web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/NEefAs8cNxYfiJsYCQjc"));
//     // web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/NEefAs8cNxYfiJsYCQjc"));
//
//     LocalStore.set('hasNode', false);
//   }
//
//   web3.eth.getBlock(0, function(e, res) {
//     console.log('network.hash: ', res.hash)
//
//     networkId = res.hash.slice(2,8);
//
//     switch(res.hash) {
//       case '0x41941023680923e0fe4d74a34bdac8141f2540e3ae90623718e47d66d1ca4a2d':
//         network='ropsten';
//         registrarAddress='0xf9fc991b4328db1e9b09addc039eb469d151cdbc';
//         publishedAtBlock = 25409;
//         break;
//       case '0x0cd786a2425d16f152c658316c423e6ce1181e15c3295826d7c9904cba9ce303':
//         network='morden';
//         break;
//       case '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3':
//         network='main';
//         registrarAddress='0x314159265dd8dbb310642f98f50c066173c1259b';
//         publishedAtBlock = 3605331;
//         resolve();
//         break;
//       default:
//         network='private';
//     }
//   });
//     //
//   callback(web3)
// }
