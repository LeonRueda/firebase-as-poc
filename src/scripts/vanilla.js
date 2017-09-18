/**
 * Created by pedro.rueda on 18/09/2017.
 */
import * as firebase from 'firebase/app';
import * as database from 'firebase/database';

var defaultMessage = {
  body: "body", // string;
  color: "color", // string;
  createdAt: {}, // Object;
  referrer: "referrer", // string;
  uid: "uid", // string;
  username: "UserName" // string;
}, counter = 0, interval = 5000;

var app = {
  init: function () {
    const config = {
      apiKey: "AIzaSyD5pgr5gnepLaJYfXthXP98sRo162730rI",
      authDomain: "turneraschat.firebaseapp.com",
      databaseURL: "https://turneraschat.firebaseio.com",
      projectId: "turneraschat",
      storageBucket: "turneraschat.appspot.com",
      messagingSenderId: "342325063686",
      counter: counter
    };
    firebase.initializeApp(config);
    this.database = firebase.database();
    this.ref = this.database.ref('general-probe');
    this.receiveMessage();
  },
  receiveMessage: function () {
    var query = this.ref.orderByChild('createdAt').limitToLast(1);
    query.on('child_added', function ( snapshot ) { console.log( snapshot.val() ) });
  },
  sendMessage: function(message) {
    defaultMessage.counter = counter++;
    message = message || defaultMessage;
    app.ref.push( message );

    setTimeout( app.sendMessage, interval );
  },

};
app.init();
app.sendMessage();
