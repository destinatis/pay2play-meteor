import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';

import { connect } from '/imports/lib/ethereum';

Meteor.startup(function() {

  // SET default language
  if(Cookie.get('TAPi18next')) {
      TAPi18n.setLanguage(Cookie.get('TAPi18next'));
  } else {
      var userLang = navigator.language || navigator.userLanguage,
      availLang = TAPi18n.getLanguages();

      // set default language
      if (_.isObject(availLang) && availLang[userLang]) {
          TAPi18n.setLanguage(userLang);
          // lang = userLang;
      } else if (_.isObject(availLang) && availLang[userLang.substr(0,2)]) {
          TAPi18n.setLanguage(userLang.substr(0,2));
          // lang = userLang.substr(0,2);
      } else {
          TAPi18n.setLanguage('en');
          // lang = 'en';
      }
  }

  // Setup Moment and Numeral i18n support
  Tracker.autorun(function(){
      if(_.isString(TAPi18n.getLanguage())) {
          moment.locale(TAPi18n.getLanguage().substr(0,2));
          numeral.language(TAPi18n.getLanguage().substr(0,2));
      }
  });

});

// ROUTES
Router.route('/', function () {
  // render the Home template with a custom data context


  // console.log(web3.eth.accounts);
  // console.log(web3.eth.accounts);

  // hideErrorDialog();
  // showErrorDialog();

  this.render('home', {
    data: {}
  });
});
Router.route('/start', function () {
  // render the Home template with a custom data context

  // hideErrorDialog();

  this.render('start', {});
});
Router.route('/invite/:_id', function () {
  this.render('invite_template', {
    template: 'invite_template',
    data: function() {
      _id: this.params._id
    }
  });
});
Router.route('/wager/:_id', function () {
  this.render('wager_template', {
    template: 'wager_template',
    data: function() {
      _id: this.params._id
    }
  });
});
Router.route('/support', function () {
  // render the Home template with a custom data context
  this.render('support', {
    data: {
      title: 'My Title'
    }
  });
});
// ROUTES

Template.debug.helpers({
  version: function() {
    return "1.0.0";
  }
});
Template.footer.helpers({
  blockNumber () {
    return Session.get('blockNumber');;
  },
  authorizedAccount () {
    return Session.get('authorizedAccount');
  },
  libraryVersion () {
    return Session.get('libraryVersion');
  }
});

Template.footer.onRendered(function() {
  console.log("footer");

  Session.set('authorizedAccount', "None");

  ethereum.onStatusChange(status => {
    if (status.isReady) {
      // var subscription = web3.eth.subscribe('newBlockHeaders', function(error, result) {
      //     if (!error) {
      //         console.log(blockHeader);
      //     }
      // })
      // .on("data", function(blockHeader){
      // });

      // // unsubscribes the subscription
      // subscription.unsubscribe(function(error, success){
      //     if(success)
      //         console.log('Successfully unsubscribed!');
      // });

      console.log("ethereum is ready");

      web3.eth.getAccounts((err, accounts) => {

        console.log(accounts);

        if (err || !accounts || accounts.length == 0) return;

        authorizedAccount = accounts[0];

        Session.set('authorizedAccount', authorizedAccount);
      });

      web3.eth.getBlockNumber((err, blockNumber) => {
        console.log(blockNumber);
        Session.set('blockNumber', blockNumber);
      });

      Session.set("libraryVersion", web3.version);
    }
  });
  ethereum.init();

  // connect(function(web3) {
  //   console.log("connect");
  //
  //   web3.eth.getAccounts((err, accounts) => {
  //
  //     console.log(accounts);
  //
  //     if (err || !accounts || accounts.length == 0) return;
  //
  //     authorizedAccount = accounts[0];
  //
  //     Session.set('authorizedAccount', authorizedAccount);
  //   });
  // });
});
