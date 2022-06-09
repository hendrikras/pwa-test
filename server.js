// Pull in dependencies
const express = require('express');
const webPush = require('web-push');
const bodyParser = require('body-parser');

// Server settings with ExpressJS
const app = express();
const port = process.env.PORT || 3000;
const runningMessage = 'Server is running on port ' + port;

// Set up custom dependencies
// Constants just contains common messages so they're in one place
const constants = require('./constants');
let vapidKeys = {
  publicKey: "BC0d86zq9_PU4x2_5-raBEX6ZDLOWRZYaUoK0zwmQBsih3znJYks1j9eT5gzXi9SpjmYfJOGOAN5LotTk_kJI20",
  privateKey: "LEpTjCU3EJOD5K41zE7AirIzuFQ9PfhilInq3b-Llgk"
};

webPush.setVapidDetails(
    'mailto:hras@anwb.nl',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

let subscriptions = [];

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
  );
  return next();
});

app.post('/subscribe', (req, res) => {
  const body = JSON.stringify(req.body);
  let sendMessage;
  if (subscriptions.includes( body)) {
    sendMessage = constants.messages.SUBSCRIPTION_ALREADY_STORED;
  } else {
    subscriptions.push(body);

    sendMessage = constants.messages.SUBSCRIPTION_STORED;
  }
  res.send(sendMessage);
});

app.post('/push', (req, res, next) => {
  const pushSubscription = req.body.pushSubscription;
  const notificationMessage = req.body.notificationMessage;
// console.log('push', subscriptions);
// console.log('not', notificationMessage);
//   if (!pushSubscription) {
//     res.status(400).send(constants.errors.ERROR_SUBSCRIPTION_REQUIRED);
//     return next(false);
//   }

   if (subscriptions.length > 0) {
    subscriptions.map((subscription, index) => {
      let jsonSub = JSON.parse(subscription);

      webPush.sendNotification(jsonSub, notificationMessage)
          .then(success => handleSuccess(success, index))
          .catch(error => handleError(error, index));
    });
  } else {
    res.send(constants.messages.NO_SUBSCRIBERS_MESSAGE);
    return next(false);
  }

  function handleSuccess(success, index) {
    res.send(constants.messages.SINGLE_PUBLISH_SUCCESS_MESSAGE);
    return next(false);
  }

  function handleError(error, index) {
    console.log('error', error)
    res.status(500).send(constants.errors.ERROR_MULTIPLE_PUBLISH);
    return next(false);
  }
});

app.get('/', (req, res) => {
  res.send(runningMessage);
});

app.listen(port, () => console.log(runningMessage));
