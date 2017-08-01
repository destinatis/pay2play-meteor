import makeMethod from './makeMethod.js'

const hideErrorDialog = makeMethod('errorDialog.hide', function() {
  console.log('hideErrorDialog');
  $('#error-container').hide();
  $('#error-message').hide();
});

const showErrorDialog = makeMethod('errorDialog.show', function(message) {
  console.log('showErrorDialog');
  $('#error-container').show();
  $('#error-message').show();
  $("#error-message").text(message);
});

export {
  hideErrorDialog,
  showErrorDialog
};
