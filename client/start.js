import { hideErrorDialog } from './methods.js';
import { showErrorDialog } from './methods.js';

import Helpers from '/imports/lib/helpers/helperFunctions';

import { registrar } from '/imports/lib/ethereum';
import { network } from '/imports/lib/ethereum';

// HELPERS
Template.start.helpers({
  showLoader() {
    return Session.get('showLoader');
  }
});
// HELPERS

Template.start_wager_template.onRendered(function() {

  ethereum.onStatusChange(status => {
    if (status.isReady) {
      console.log("ethereum ready");
    }
  });
  // ethereum.init();
});
Template.start_wager_template.events({
  'submit .start-wager-form'(event) {
    console.log('start-wager-form');

    event.preventDefault();

    const target = event.target;
    var amount = target.amount.value;

    amount = Number(amount);

    console.log(amount);

    let authorizedAccount = Session.get('authorizedAccount');
    console.log("authorizedAccount: " + authorizedAccount);

    hideErrorDialog();

    if (!Session.get("selectedGame")) {
      showErrorDialog("Please select wager type.");
      return;
    }

    if (authorizedAccount != 'None') {
      if ($.isNumeric(amount)) {
        if (amount > 0) {
          target.amount.value = '';

          Session.set('showLoader', true);

          setTimeout(function() {

            const wagerAmount = web3.utils.toWei(Session.get('wagerAmount'), 'ether');

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
              var selectedGame = Session.get("selectedGame");
              console.log('selectedGame', selectedGame);

              var rulesHash = selectedGame.hash;

              registrar.createWagerAndDeposit(rulesHash, {
                value: wagerAmount,
                from: authorizedAccount,
                gas: 650000,
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

                  // Router.go('/invite/' + _id);

                  Router.go('/');
                },
                onError: (error) => {
                  console.log("onError");

                  Session.set('showLoader', false);

                  // PendingWager.remove({_id: _id});

                  console.log("cancelled");
                }
              }));

              console.log("payment submitted");
            }

            // var _id = Deposits.insert({
            //   amount: amount,
            //   causeId: Router.current().params._id
            // });


            // Router.go('/deposit-receipt/' + _id);

          }, 1000);
        } else {
          showErrorDialog("Please be precise and specific.");
        }
      } else {
        showErrorDialog("Err, what are you talking about?");
      }
    } else {
      showErrorDialog("Please connect your payment account.");
    }
  },
  'input input[name="amount"]': function(e){
    var maxAmount = TemplateVar.get('maxAmount') || 0.01;
    var wagerAmount = Math.min(Number(e.currentTarget.value) || 0.01, maxAmount);
    // TemplateVar.set('wagerAmount', wagerAmount);

    Session.set('wagerAmount', wagerAmount);
  },
});

// DROPDOWN
Template.swarm_data_dropdown_template.helpers({
  games: function() {
    return Session.get("games");
  }
});
Template.swarm_data_dropdown_template.events({
    "change #game-select": function (event, template) {
        var id = $(event.currentTarget).val();
        console.log("game : " + id);

        var game = _.find(Session.get("games"), function(game) {
          return game["id"] == id;
        });

        console.log(game);

        Session.set("selectedGame", game);

        hideErrorDialog();
    }
});
// DROPDOWN

//
// LOAD SWARM DATA
// ASYNC
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
// ASYNC
// LOAD SWARM DATA
//
Template.dialog_start.helpers({
  showWagerLoader: function() {
    return Session.get("showWagerLoader");
  },
  gamesAvailable: function() {
    return (Session.get("games").length > 0);
  },
  selectedGame: function() {
    return (Session.get("selectedGame"));
  }
});
Template.load_values_template.events({
    'click #load-wagers': function(e) {
      console.log("SWARM START");

      Session.set("showWagerLoader", true);
      hideErrorDialog();

      // http://swrm.io/bzz:/00a45de262be72e59530b182be45292f92d21e9aa029845529dd45cf9330f201/

      var hash = "00a45de262be72e59530b182be45292f92d21e9aa029845529dd45cf9330f201";

      // curl -H "Content-Type: application/json" --data-binary "{\"a\":2}" http://localhost:8500/bzz:/
      // curl -F '1/data.json={"title":"a"};type=application/json' http://localhost:8500/bzz:/
      // curl -F '2/data.json={"title":"a"};type=application/json' http://localhost:8500/bzz:/49cfe1a53e5bd42884d8b778b566cbd0c6e511d0f61e5afb6d2238a1ca142280
      // curl -F 'dir1/file.txt=some-data;type=text/plain' -F 'dir2/file.txt=some-data;type=text/plain' http://localhost:8500/bzz:/

      var url = '';
      url = "http://swrm.io/bzz:/" + hash + "/?list=true";
      // url = "http://swarm-gateways.net/bzz:/" + hash + "/?list=true";

      // tar c 1.json 2.json | curl -H "Content-Type: application/x-tar" --data-binary @- http://localhost:8500/bzz:/
      // curl http://swrm.io/bzz:/28d75bab6e5a2b976dbd5ead7edff896fd0def0b4ae2a3e67df61b233b30cd75/?list=true

      function fetch(game, callback) {
        // console.log(game);

        var url = '';
        url = "http://swrm.io/bzzr:/" + game["hash"];
        // url = "http://swarm-gateways.net/bzzr:/" + game["hash"];

        console.log(url);

        Meteor.http.call("GET", url, function(error, result) {
          // console.log(error, result);

          if (error) {
            console.error(error);
            return;
          }

          result = JSON.parse(result.content);
          // console.log(result);

          game["rules"] = result;

          callback(game);
        });
      }

      Meteor.http.call("GET", url, function(error, result) {
        console.log(error, result);

        if (error) {
          console.error(error);
          Session.set("showWagerLoader", false);
          showErrorDialog("Network error.");
          return;
        }

        if (result["statusCode"] == 200) {
          // var entries = result["content"].toJSON();

          result = JSON.parse(result.content);
          // console.log(result);

          var entries = result["entries"];

          console.log(entries);

          var filtered_entries = _.filter(entries, function(entry) {
              return entry["path"].includes('json');
          });

          console.log("FILTERED ENTRIES");
          console.log(filtered_entries);

          var games = [];
          _.each(filtered_entries, function(filtered_entry) {

            var hash = filtered_entry["hash"];
            var path = filtered_entry["path"]

            var game = {
              "id": path.replace(".json", ""),
              "hash": hash,
              "rules": filtered_entry["rules"]
            };

            // fetch(hash);
            games.push(game);
          });

          function display(objects) {
            setTimeout(function() {
              console.log("display");
              console.log(objects);

              Session.set("showWagerLoader", false);
              Session.set("games", objects);
            }, 1000);
          }

          eachAsync(games, fetch, display);
        };
      });

      // web3.bzz.download("ae91c8debaa2db6bd3e54b12d44fc7c253f67d286a8c8aa37ff79cbd68622714").then(buffer => { console.log(buffer) });
      // console.log("SWARM END");
    }
});
