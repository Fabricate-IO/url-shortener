const express = require('express');
const tabletop = require('tabletop');
const app = express();
const config = require('./config');

if (config.SHEET_KEY === 'YOUR_SHEET_KEY_HERE') {
  throw new Error("You must first change the sheet key in config.js before starting.");
}

// Map shorturl path to actual URL
var urlmap = {};

function fetch_url_sheet(uri) {
	tabletop.init({
    key: config.SHEET_KEY,
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
	setInterval(fetch_url_sheet, config.REFRESH_INTERVAL);
  setupRoutes(app);
	const port = process.env.DOCKER_PORT || 8000;
  var server = app.listen(port, function () {
    var port = server.address().port;
    console.log('App listening on port %s', port);
  });
}

module.exports = app;