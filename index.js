
const express = require('express');
const tabletop = require('tabletop');
const app = express();

// Map shorturl path to actual URL
var urlmap = {};

var REFRESH_INTERVAL = 60*60*1000;

function fetch_url_sheet(uri) {
	tabletop.init({
    key: 'https://docs.google.com/spreadsheets/d/1aAuh2LueJ-2YuGphBIS-OQn4DfrZzOsU3pcwlSUGrjM/pubhtml',
    simpleSheet: true,
    callback: function (data, tabletop) {
      urlmap = {};
      console.log("URL map updated");
      for (var i = 0; i < data.length; i++) {
        urlmap[data[i]['ShortURL segment']] = data[i]['Target URL'];
      }
    }
  });
}

const setupRoutes = function(app) {
  const router = express.Router();
  router.get('/_forcereload', (req, res) => {
  	fetch_url_sheet();
  	res.send('Reloaded - updates should be visible in a few seconds.');
  	res.status(200).end();
  })
  router.get('/:shorturl', (req, res) => {
  	console.log("Got request!");
 		var true_url = urlmap[req.params.shorturl];
	 	if (!true_url) {
	 		res.status(404).end();
	 		return;
	 	}
    res.header('Location', true_url);
    res.status(301).end();
  });
  app.use(router);
};

if (module === require.main) {
	fetch_url_sheet();
	setInterval(fetch_url_sheet, REFRESH_INTERVAL);
  setupRoutes(app);
	const port = process.env.DOCKER_PORT || 8000;
  var server = app.listen(port, function () {
    var port = server.address().port;
    console.log('App listening on port %s', port);
  });
}

module.exports = app;