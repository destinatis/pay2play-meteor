import { Meteor } from 'meteor/meteor';

function makeMethod(name, fn) {
  Meteor.methods({ [name]: fn });

  return (...args) => {
    Meteor.call(name, ...args);
  };
}

export default makeMethod;
