import { hideErrorDialog } from './methods.js';
import { showErrorDialog } from './methods.js';

import util from 'ethereumjs-util';

import Helpers from '/imports/lib/helpers/helperFunctions';

import { network, registrar, registrarAddress } from '/imports/lib/ethereum';

import { fetchSwarmFile } from '/imports/lib/swarm';

// import moment from 'moment-duration-format';

// HELPERS
Template.registerHelper("equals", function (a, b) {
  return (a == b);
});
Template.invite_template.helpers({
  showLoader() {
    return Session.get('showLoader');
  }
});
Template.dialog_invite.helpers({
  owner() {
    return Session.get('owner');
  },
  isAuthorized: function(address) {
    return Session.get('authorizedAccount') === address;
  },
  wagerState() {
    return Session.get('wagerState');
  },
  index() {
    return Session.get('index');
  },
  amount() {
    return Session.get('amount');
  },
  rulesHash() {
    return Session.get('rulesHash');
  },
  rulesAcquired() {
    return Session.get('rulesAcquired');
  },
  rules() {
    return Session.get('rules');
  },
  startTime() {
    return Session.get('startTime');
  }
});
Template.depositor_list_template.helpers({
  depositors() {
    return Session.get('depositors');
  },
  authorizedAccount() {
    return Session.get('authorizedAccount');
  },
  isAuthorized: function(address) {
    return Session.get('authorizedAccount') === address;
  }
});
Template.invite_event_logs_template.helpers({
  newDeposit_Transactions() {
    return Session.get('newDeposit_Transactions');
  },
  winnerSelected_Transactions() {
    return Session.get('winnerSelected_Transactions');
  },
  winningsWithdraw_Transactions() {
    return Session.get('winningsWithdraw_Transactions');
  }
})
// HELPERS

Template.dialog_invite.events({
  'submit .counter-wager-form'(event) {
    console.log('counter-wager-form');

    event.preventDefault();

    const target = event.target;

    let authorizedAccount = Session.get('authorizedAccount');
    console.log("authorizedAccount: " + authorizedAccount);

    hideErrorDialog();

    if (authorizedAccount != 'None') {
      Session.set('showLoader', true);
      setTimeout(function() {
        const wagerAmount = Session.get('amount');
        console.log(wagerAmount);

        const gasPrice = TemplateVar.getFrom('.dapp-select-gas-price', 'gasPrice') || web3.utils.toWei(20, 'shannon');

        if (!authorizedAccount || !(authorizedAccount.length >= 40)) {
          GlobalNotification.error({
            content: 'No accounts added to dapp',
            duration: 3
          });
        } else if (!wagerAmount || wagerAmount < 10000000000000000) {
          GlobalNotification.error({
            content: 'Bid below minimum value',
            duration: 3
          });
        } else {

          var index = Router.current().params._id;

          registrar.counterWagerAndDeposit(index,  {
            value: wagerAmount,
            from: authorizedAccount,
            gas: 650000,
            // gas: 1000000,
            gasPrice: gasPrice
          }, Helpers.getTxHandler({
            onDone: () => {
              console.log("onDone");
              Session.set('showLoader', false);
            },
            onSuccess: (txid, receipt) => {
              console.log("onSuccess");

              console.log(txid, receipt);

              Session.set('showLoader', false);

              console.log(typeof(txid));
              console.log(typeof(receipt));

              // PendingWagers.update(_id, {
              //   $push: {txid, receipt}
              // });

              Router.go('/wager/' + index);
            },
            onError: (error) => {
              console.log("onError");

              Session.set('showLoader', false);

              // console.log("wager.shaWager: " + wager.shaWager);
              // PendingWager.remove({_id: _id});

              console.log("cancelled");

              Router.go('/invite/' + index);
            }
          }));

          console.log("counter submitted");
        }
      }, 1000);
    } else {
      showErrorDialog("Please connect your payment account.");
    }
  }
});

function pullEventLog(address, index, key, callback) {
  var events = {
    "WagerStarted": "0x52b3086eb00fd2639eeb5190527da3e1c4c1400ee550073dde793315159cfe77",
    "NewDeposit": "0xe6d83b1e0e5126a0574d0154ed77e40181534edcb74f035b158d92ed3d10a030",
    "WagerWinnerUpdated": "0x8cc07436b787fa8a30ca1402a2867cf1b592be47c9f6be3709cf2dba53dc83df",
    "WinningsWithdrawn": "0x9f1f3144430cc9624860cf28da61318e428f6d15f17e420c04e8203581951a91"
  };

  var topic0 = events[key];

  var topic1 = util.bufferToHex(util.setLengthLeft(parseInt(index), 32));

  var url = "https://ropsten.etherscan.io/api?module=logs&action=getLogs&fromBlock=0&toBlock=pending&address=" + address + "&topic0=" + topic0 + "&topic0_1_opr=and" + "&topic1\=" + topic1;
  Meteor.http.call("GET", url, function(error, result) {
    console.log(key + " logs obtained");
    result = JSON.parse(result.content);
    callback(result["result"]);
  });
}

function sync(address, index, callback) {
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

  // https://ethereum.stackexchange.com/questions/12591/convert-a-number-to-a-32-bit-hex-number-using-web3

  var topic0 = "0x52b3086eb00fd2639eeb5190527da3e1c4c1400ee550073dde793315159cfe77";
  // var topic1 = "0x0000000000000000000000000000000000000000000000000000000000000000";

  var topic1 = util.bufferToHex(util.setLengthLeft(parseInt(index), 32));

  console.log(topic1);

  var url = "https://ropsten.etherscan.io/api?module=logs&action=getLogs&fromBlock=0&toBlock=latest&address=" + address + "&topic0=" + topic0 + "&topic0_1_opr=and" + "&topic1\=" + topic1;

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

var template;

Template.dialog_invite.onRendered(function() {

  // console.log("MOMENT: " + moment.duration(123, "minutes").format("y [years], M [months], d [days], h [hours], m [minutes], s [seconds]"));

  Session.set('showLoader', false);

  template = this;

  var index = Router.current().params._id;
  var authorizedAccount;

  ethereum.onStatusChange(status => {
    if (status.isReady) {
      console.log("loaded");

      pullEventLog(registrarAddress, index, "NewDeposit", function(transactions) {
        console.log(transactions);

        var newDeposit_Transactions = [];

        _.each(transactions, function(transaction) {
          var txid = transaction["transactionHash"];
          console.log("https://" + network + ".etherscan.io/tx/" + txid);

          newDeposit_Transactions.push({
            txid: txid,
            url: "https://" + network + ".etherscan.io/tx/" + txid
          });
        });
        Session.set("newDeposit_Transactions", newDeposit_Transactions);
      });
      pullEventLog(registrarAddress, index, "WagerWinnerUpdated", function (transactions) {
        console.log(transactions);

        var winnerSelected_Transactions = [];

        _.each(transactions, function(transaction) {
          var txid = transaction["transactionHash"];
          console.log("https://" + network + ".etherscan.io/tx/" + txid);

          winnerSelected_Transactions.push({
            txid: txid,
            url: "https://" + network + ".etherscan.io/tx/" + txid
          });
        });
        Session.set("winnerSelected_Transactions", winnerSelected_Transactions);
      });
      pullEventLog(registrarAddress, index, "WinningsWithdrawn", function (transactions) {
        console.log(transactions);

        var winningsWithdraw_Transactions = [];

        _.each(transactions, function(transaction) {
          var txid = transaction["transactionHash"];
          console.log("https://" + network + ".etherscan.io/tx/" + txid);

          winningsWithdraw_Transactions.push({
            txid: txid,
            url: "https://" + network + ".etherscan.io/tx/" + txid
          });
        });
        Session.set("winningsWithdraw_Transactions", winningsWithdraw_Transactions);
      });

      registrar.getWager(index, function(error, result) {
        console.log(result);

        Session.set('wagerState', result[0].toString());

        var startedAt = result[1];

        var date = new Date(startedAt * 1000);

        Session.set('startTime', date)

        Session.set('index', index);
        Session.set('amount', result[2].toString());

        Session.set('depositors', result[4]);
        Session.set('owner', result[4][0]);

        var rulesHash = result[5].replace('0x', '');
        Session.set('rulesHash', rulesHash);

        // fetchSwarmFile START
        web3.eth.getBlock('latest', function(err, block) {
          console.log(block);

          function parse(result) {
            console.log("parse", result);

            Session.set("rulesAcquired", true);

            var timeUntilEnd = result.duration - (block.timestamp - startedAt);

            var rules = {
              title: result.title.replace(".", ""),
              timeUntilEnd: moment.duration(timeUntilEnd, "seconds").format("y [years], M [months], d [days], h [hours], m [minutes], s [seconds]")
            };

            Session.set("rules", rules);
          }

          fetchSwarmFile(rulesHash, parse);
          // fetchSwarmFile END
        });
        // fetchSwarmFile END
      });
    }
  });
});
