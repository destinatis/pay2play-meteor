import { hideErrorDialog } from './methods.js';
import { showErrorDialog } from './methods.js';

import util from 'ethereumjs-util';

import Helpers from '/imports/lib/helpers/helperFunctions';

import { network, registrar, registrarAddress } from '/imports/lib/ethereum';

// HELPERS
Template.registerHelper("equals", function (a, b) {
  return (a == b);
});
Template.wager_template.helpers({
  showLoader() {
    return Session.get('showLoader');
  }
});
Template.dialog_wager.helpers({
  wagerState() {
    return Session.get('wagerState');
  },
  isAdmin() {
    return (Session.get('registrarOwner') === Session.get('authorizedAccount'));
    // return true;
  },
  authorizedAccount() {
    return Session.get('authorizedAccount');
  },
  isAuthorized: function(address) {
    return Session.get('authorizedAccount') === address;
  },
  winner() {
    return Session.get('winner');
  },
  winningsNotWithdrawn() {

    var transactions = Session.get('winningsWithdraw_Transactions');

    var flag = false;

    if (transactions != undefined) {
      flag = (transactions.length == 0);
    }

    return flag;
  },
  index() {
    return Session.get('index');
  },
  amount() {
    return Session.get('amount');
  },
  count() {
    return Session.get('count');
  },
  rulesHash() {
    return Session.get('rulesHash');
  }
});
Template.winner_selector_template.helpers({
  owners() {
    return Session.get('owners');
  }
});
Template.wager_event_logs_template.helpers({
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

// EVENTS
Template.dialog_wager.events({
  'submit .withdraw-winnings-form'(event) {
  	console.log('withdraw-winnings-form');

    event.preventDefault();

    const target = event.target;


    let authorizedAccount = Session.get('authorizedAccount');
    console.log("authorizedAccount: " + authorizedAccount);

    hideErrorDialog();

    if (authorizedAccount != 'None') {

      Session.set('showLoader', true);

      setTimeout(function() {

      if (!authorizedAccount || !(authorizedAccount.length >= 40)) {
        GlobalNotification.error({
          content: 'No accounts added to dapp',
          duration: 3
        });
      } else {
        const index = Router.current().params._id;

        registrar.withdrawWinnings(index, {
          from: authorizedAccount,
          gas: 300000
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

            Router.go('/wager/' + index);
          },
          onError: (error) => {
            console.log("onError");

            Session.set('showLoader', false);

            console.log("cancelled");
          }
        }));

        console.log("withdraw winnings");
      }
    }, 1000);
    } else {
      showErrorDialog("Please connect your payment account.");
    }
  }
});
Template.winner_selector_template.events({
  'submit .winner-selector-form'(event) {
  	console.log('winner-selector-form');

    event.preventDefault();

    const target = event.target;

    var owner_0 = target.owner_0.value;
    var owner_1 = target.owner_1.value;

    console.log("owners");
    console.log("owner_0: " + owner_0);
    console.log("owner_1: " + owner_1);

    var winner;
    if (owner_0) {
      winner = owner_0;
    }

    if (owner_1) {
      winner = owner_1;
    }

    console.log("winner: " + winner);

    Session.set('showLoader', true);

    const index = Router.current().params._id;

    setTimeout(function() {
      let registrarOwner = Session.get("registrarOwner", registrarOwner);

      console.log("registrarOwner: " + registrarOwner);

      if (!registrarOwner || !(registrarOwner.length >= 40)) {
        GlobalNotification.error({
          content: 'No accounts added to dapp',
          duration: 3
        });
      } else {
        registrar.setWagerWinner(index, winner, {
          from: registrarOwner,
          gas: 300000
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

            Router.go('/wager/' + index);
          },
          onError: (error) => {
            console.log("onError");

            Session.set('showLoader', false);

            console.log("cancelled");
          }
        }));

        console.log("set winner");
      }
    }, 1000);
  }
});
// EVENTS

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

var template;

Template.dialog_wager.onRendered(function() {
  template = this;
  var index = Router.current().params._id;

  // web3.eth.getBalance(accounts[0], function(e, balance) {
  //   var maxAmount = Number(web3.fromWei(balance, 'ether').toFixed());
  //   TemplateVar.set(template, 'maxAmount', maxAmount);
  //   console.log(maxAmount);
  // });

  ethereum.onStatusChange(status => {
    if (status.isReady) {
      console.log("ethereum client ready");

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
        // console.log(result);

        var state = 0;

        switch(result[0].toString()) {
          case "0":
            state = 0; // open
            break;
          case "1":
            state = 1; // closed
            break;
          case "2":
            state = 2; // finished
            break;
        }

        console.log(state);

        Session.set('wagerState', state);

        Session.set('index', index);

        Session.set('amount', result[2].toString());

        Session.set('winner', result[3]);

        Session.set('count', result[4].length);

        Session.set('owners', result[4]);

        Session.set('rulesHash', result[5].replace('0x', ''));

        Session.set("registrarOwner", registrar.node);

      });
    }
  });
  // ethereum.init();
});
