export function fetchSwarmFile(hash, callback) {
  var url = '';
  url = "http://swrm.io/bzzr:/" + hash;
  url = "http://swarm-gateways.net/bzzr:/" + hash;
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

    callback(result);
  });
}
