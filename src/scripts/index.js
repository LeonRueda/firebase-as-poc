import * as firebase from 'firebase';
import Rx from 'rxjs';
import R from 'ramda';
var defaultMessage = {
  body: "body", // string;
  color: "color", // string;
  createdAt: {}, // Object;
  referrer: "referrer", // string;
  uid: "uid", // string;
  username: "UserName" // string;
}, counter = 0;
const parseMessage = function (snap) {
  return ({
    val : snap.val(),
    id: snap.key,
    createdAt: Date.now(),
    serverTime: snap.val().createdAt
  });
};

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
    this.ref$ = Rx.Observable.of(this.ref);
    this.configureTiming();
    this.receiveMessage();
  },
  sendMessage: function(message) {
    defaultMessage.counter = counter++;
    message = message || defaultMessage;
    this.ref.push( message );
  },
  configureTiming: function () {
    var ref = this.database.ref('.info/serverTimeOffset');
    this.query = this.ref$
      .map(function (ref) { ref.orderByChild('createdAt').limitToLast(1) })
      .shareReplay(1);
    this.source = this.query
      .switchMapTo( ref, function (query, offset) {
        const now = Date.now() + offset;
        return Observable.fromEvent(query, 'child_added', parseMessage)
          .filter(function (time) { return time.serverTime >= now });
      })
      .switch()
      .filter(R.allPass([ R.has('body'), R.has('uid'), R.has('username') ]));
  },
  receiveMessage: function () {
    var query = this.ref.orderByChild('createdAt').limitToLast(1);
    //Rx.Observable.fromEvent(query, 'child_added', parseMessage).subscribe( function ( val ) { console.log( val ) });
  }
};
  app.init();
//
// const timer$ = Rx.Observable.interval(5000);
// timer$.subscribe(
//   function ( data ) {
//     return app.sendMessage()
//   },// mostrará por consola cada segundo: 1, 2, 3, 4...
//   function (err) {
//    console.error(err);
//   }
// );