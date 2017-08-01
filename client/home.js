import ethereum, { errors } from '/imports/lib/ethereum';
import { network, registrar, registrarAddress } from '/imports/lib/ethereum';


import { retrievePendingWagers } from '/imports/lib/wagers';

// HELPERS
Template.component_wager.helpers({
  transaction_url: function(txid) {
    return "https://" + network + ".etherscan.io/tx/" + txid;
  }
});
Template.wager_list.helpers({
  wagers() {
    return Session.get('wagers');
  }
});
Template.home.helpers({
  showWagerList() {
    return Session.get('showWagerList');
  }
});
// HELPERS

Template.home.onCreated(function(){
  ethereum.onStatusChange(status => {
    console.log("onStatusChange");
    console.log(status);

    TemplateVar.set(this, 'networkError', false)
    TemplateVar.set(this, 'isReady', status.isReady)
    TemplateVar.set(this, 'description', status.description)
    if (status.theresAnError) {
      TemplateVar.set(this, 'theresAnError', status.theresAnError)
      if (status.description === errors.invalidNetwork) {
        TemplateVar.set(this, 'networkError', true)
      }
    }
  });
  // ethereum.init();
});

function sync(address, callback) {
  // SYNC TRANSACTIONS

  // http://api.etherscan.io/api?module=account&action=txlist&address=0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c&sort=asc
  //
  //
  // https://api.etherscan.io/api?module=logs&action=getLogs
  // &fromBlock=379224
  // &toBlock=latest
  // &address=0x33990122638b9132ca29c723bdf037f1a891a70c
  // &topic0=0xf63780e752c6a54a94fc52715dbc5518a3b4c3c2833d301a204226548a2a8545
  // &apikey=YourApiKeyToken
  //
  // https://ropsten.etherscan.io/api?module=logs&action=getLogs
  // &fromBlock=0
  // &toBlock=latest
  // &address=0x04155a6be5cbf88586244afc1a8b402c35986ecc
  // &topic0=0xf63780e752c6a54a94fc52715dbc5518a3b4c3c2833d301a204226548a2a8545
  // &topic0_1_opr=and
  // &topic1=0x72657075746174696f6e00000000000000000000000000000000000000000000

  var url = "https://ropsten.etherscan.io/api?module=logs&action=getLogs&fromBlock=0&toBlock=latest&address=" + address;

  console.log(url);

  Meteor.http.call("GET", url, function(error, result) {
    // console.log(error, result);
    console.log("sync transactions");

    result = JSON.parse(result.content);

    // console.log(result["result"]);

    callback(result["result"]);

  });
  // SYNC TRANSACTIONS
}

Template.home.onCreated(function() {
  console.log("home.onCreated");
  template = this;

  TemplateVar.set(this, 'showWagerList', false)

  function retrieveWager(index, callback) {
      var wagers = [];
      registrar.getWager(index.toString(), function(error, result) {
        console.log(result);

        var state = "open";

        switch(result[0].toString()) {
          case "0":
            state = "open";
            break;
          case "1":
            state = "closed";
            break;
          case "2":
            state = "finished";
            break;
        }

        // console.log(new Date(result[1] * 1000));

        var date = new Date(result[1] * 1000);

        var wager = {
          index: index,
          state: state,
          date: date,
          amount: result[2].toString(),
        };

        callback(wager);
      });
  }

  function eachAsync(array, f, callback) {
      var doneCounter = 0, results = [];

      array.forEach(function (item) {
          f(item, function (res) {
              doneCounter += 1;
              results.push(res);

              if (doneCounter === array.length) {
                  callback(results);
              }
          });
      });
  }

  ethereum.onStatusChange(status => {
    if (status.isReady) {
      console.log("loaded");

      // sync(registrarAddress, function (transactions) {
      //   console.log(transactions);
      //
      //   var events = {
      //     "WagerStarted": "0x52b3086eb00fd2639eeb5190527da3e1c4c1400ee550073dde793315159cfe77",
      //     "NewDeposit": "0xe6d83b1e0e5126a0574d0154ed77e40181534edcb74f035b158d92ed3d10a030"
      //   };
      //
      //   _.each(transactions, function(transaction) {
      //     var topics = transaction["topics"];
      //
      //     switch (topics[0]) {
      //       case events["WagerStarted"]:
      //         console.log("WS");
      //       break;
      //       case events["NewDeposit"]:
      //         console.log("ND");
      //       break;
      //     }
      //     // console.log(transaction["topics"]);
      //
      //   });
      // });

      Session.set('showWagerList', false);

      registrar.getWagerCount(function(error, result) {
        console.log(result);

        var index = result - 1;

        var wagerIndices = Array.from({length: result}, (v, k) => k);
        wagerIndices.reverse();

        function display(wagers) {
            // console.log(wagers);

            var sorted = _.sortBy(wagers, function(wager) {
              return - (wager.date.getTime());
            });

            Session.set('showWagerList', true);
            Session.set('wagers', sorted);
        }

        eachAsync(wagerIndices, retrieveWager, display);
      });

      // var filter = web3.eth.filter({}, {
      //   "address": registrarAddress,
      //   "fromBlock": "0x0",
      //   "toBlock": "pending",
      //   "topics":[]
      // });
      //
      // filter.get(function (err, result) {
      //   console.log("filter: " + registrarAddress);
      //   console.log(err, result);
      // });
      //
      // filter.stopWatching();
    }
  });
});
