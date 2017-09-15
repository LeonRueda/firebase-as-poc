/**
 * Created by pedro.rueda on 14/09/2017.
 */
//import { FirebaseService } from './services/FirebaseService';
//import { MessageSource } from './sources/MessageSource';
import * as firebase from 'firebase';
import Rx from 'rxjs';
import R from 'ramda';

// console.log("init testing...");
//
// console.log("loading firebase... ");
//
// var config = {
//   apiKey: "AIzaSyD5pgr5gnepLaJYfXthXP98sRo162730rI",
//   authDomain: "turneraschat.firebaseapp.com",
//   databaseURL: "https://turneraschat.firebaseio.com",
//   messagingSenderId: "342325063686",
//   projectId: "turneraschat",
//   storageBucket: "turneraschat.appspot.com"
// };
//
// let appConfig$ = Rx.Observable.of(config);
// let firebaseService = new FirebaseService(appConfig$, true);
//
// console.log("loading messages... ");
// let messageSource = new MessageSource(Rx.Observable.of('live-stream'), firebaseService);
//
// console.log("sending message... ");
// messageSource.push({
//   body: "body", // string;
//   color: "color", // string;
//   createdAt: {}, // Object;
//   referrer: "referrer", // string;
//   uid: "uid", // string;
//   username: "UserName", // string;
// });
//
// console.log("done... ");
let defaultMessage = {
  body: "body", // string;
  color: "color", // string;
  createdAt: {}, // Object;
  referrer: "referrer", // string;
  uid: "uid", // string;
  username: "UserName" // string;
}, counter = 0;

const parseMessage = (snap) => {
  return ({
    val : snap.val(),
    id: snap.key,
    createdAt: Date.now(),
    serverTime: snap.val().createdAt
  });
};

let app = {
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
    let ref = this.database.ref('.info/serverTimeOffset');
    this.query = this.ref$
      .map((ref) => ref.orderByChild('createdAt').limitToLast(1))
      .shareReplay(1);
    //let query = this.database.orderByChild('createdAt').limitToLast(1);

    this.source = this.query
      .switchMapTo( ref, (query, offset) => {
        const now = Date.now() + offset;
        return Observable.fromEvent(query, 'child_added', parseMessage)
          .filter(({ serverTime }) => serverTime >= now);
      })
      .switch()
      .filter(R.allPass([ R.has('body'), R.has('uid'), R.has('username') ]));
  },
  receiveMessage: function () {
    let query = this.ref.orderByChild('createdAt').limitToLast(1);
    Rx.Observable.fromEvent(query, 'child_added', parseMessage).subscribe( ( val ) => console.log( val ));
  }
};

  app.init();

const timer$ = Rx.Observable.interval(1000);

timer$.subscribe(
  data => app.sendMessage(), // mostrará por consola cada segundo: 1, 2, 3, 4...
  err => console.error(err)
);