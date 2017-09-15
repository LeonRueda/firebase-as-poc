import { FirebaseService } from '../services/FirebaseService';
import { IMessage, IOutgoingMessage } from '../reducers/MessageReducer';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase';
import * as R from 'ramda';
import * as Refs from '../constants/DatabaseRefs';


const parseMessage = (snap: firebase.database.DataSnapshot): IMessage => {
    console.log(snap);
    return ({
        ...snap.val(),
        id: snap.key,
        createdAt: Date.now(),
        serverTime: snap.val().createdAt
    });
}


export class MessageSource extends Observable<IMessage> {

    public ref: Observable<firebase.database.Reference>;
    public query: Observable<firebase.database.Query>;


    constructor(
        private _channel: Observable<string>,
        private _firebase: FirebaseService
    ) {
        super();

        this.ref = _channel.switchMap((channel) => channel
            ? Observable.of(`${Refs.MESSAGES}/${channel}`)
            : Observable.empty())
            .switchMap(_firebase.ref);

        this.query = this.ref
            .map((ref) => ref.orderByChild('createdAt').limitToLast(1))
            .shareReplay(1);

        this.source = this.query
            .switchMapTo(_firebase.serverTimeOffset, (query, offset) => {
                const now = Date.now() + offset;
                return Observable.fromEvent(query, 'child_added', parseMessage)
                    .filter(({ serverTime }) => serverTime >= now);
            })
            .switch()
            .filter(R.allPass([ R.has('body'), R.has('uid'), R.has('username') ]));
    }


    public push = (message: IOutgoingMessage) => this.ref
        .take(1)
        .filter(Boolean)
        .concatMap((ref: firebase.database.Reference) => Observable.fromPromise(ref.push(message)));

}
