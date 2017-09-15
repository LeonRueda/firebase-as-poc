/**
 * Created by pedro.rueda on 14/09/2017.
 */
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase';
import * as memoize from 'memoizee';
import * as R from 'ramda';
import * as Refs from '../constants/DatabaseRefs';


export interface IFirebaseAppConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  messagingSenderId: string;
  projectId: string;
  storageBucket: string;
}


export const firebaseLogger = (message: string, color = '#F5811D') => {
  console.log('%c%s', `color: ${color}; font-weight: bold;`, 'FIREBASE', message);
};


export class FirebaseService {

  private static createApp = memoize((config) => firebase.initializeApp(config, config.projectId), {
    dispose: (app: firebase.app.App) => app.delete(),
    normalizer: (args) => {
      const config = args[0];
      return config.projectId
    },
    primitive: true,
    refCounter: true,
  });


  public app: Observable<firebase.app.App>;
  public auth: Observable<firebase.auth.Auth>;
  public authState: Observable<firebase.User>;
  public db: Observable<firebase.database.Database>;
  public serverTime: Observable<number>;
  public serverTimeOffset: Observable<number>;
  public uid: Observable<string>;
  public token: Observable<string>;


  constructor(config$: Observable<IFirebaseAppConfig>, debug?: boolean) {
  if (debug) {
    firebase.database.enableLogging(firebaseLogger, false);
  }

  this.app = config$.distinctUntilChanged(R.equals).switchMap((config) => config
  ? Observable.create((observer) => {
    observer.next(FirebaseService.createApp(config));
    return () => FirebaseService.createApp.deleteRef(config);
  })
  : Observable.empty())
  .shareReplay(1);

  this.auth = this.app.map((app) => app.auth());
  this.db = this.app.map((app) => app.database());

  this.authState = this.auth
  .switchMap((auth) => Observable.create((observer) => auth.onAuthStateChanged(observer)))
  .distinctUntilChanged()
  .shareReplay(1);

  this.serverTimeOffset = this.db.map((db) => db.ref(Refs.SERVER_TIME_OFFSET))
  .switchMap((ref) => Observable.fromPromise(ref.once('value') as Promise<firebase.database.DataSnapshot>))
  .map((snap): number => snap.val())
  .shareReplay(1);

  this.serverTime = this.serverTimeOffset.map((offset) => Date.now() + offset);

  this.token = this.authState
  .switchMap((user) => user ? Observable.fromPromise(user.getToken()) : Observable.of(null));

  //this.uid = this.authState.select((auth) => auth ? auth.uid : null);
}


public ref = (path: string): Observable<firebase.database.Reference> => this.db.map((db) => db
  ? Observable.of(db.ref(path))
  : Observable.empty())
  .switch()
  .shareReplay(1);


public signInWithCustomToken = (token: string): Observable<firebase.User> => this.auth
  .concatMap((auth) => Observable.fromPromise(auth.signInWithCustomToken(token) as Promise<firebase.User>));


public signOut = () => this.auth
  .concatMap((auth) => Observable.fromPromise(auth.signOut()))
  .mapTo(null);
}

