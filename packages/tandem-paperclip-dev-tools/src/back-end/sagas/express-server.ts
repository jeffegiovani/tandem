import * as express from "express";
import { ApplicationState } from "../state";
import * as getPort from "get-port";
import * as cors from "cors";
import * as http from "http";
import * as io from "socket.io";
import * as multiparty from "connect-multiparty";
import { eventChannel } from "redux-saga";
import { createSocketIOSaga } from "aerial-common2";
import { httpRequest, VISUAL_DEV_CONFIG_LOADED } from "../actions";
import { select, fork, spawn, take, put, call } from "redux-saga/effects";

export function* expresssServerSaga() {
  yield fork(handleVisualDevConfigLoaded);
}

function* handleVisualDevConfigLoaded() {
  let server: express.Express;
  let httpServer: http.Server;
  if (httpServer) {
    httpServer.close();
  }

  const { port }: ApplicationState = yield select();

  server = express();
  server.use(cors());
  
  // start taking requests and dispatching them to other sagas
  yield fork(function*() {
    const chan = eventChannel((emit) => {
      server.use((req, res) => {
        emit(httpRequest(req, res));
      });
      return () => {

      };
    });

    while(true) {
      yield put(yield take(chan));
    }
  });

  // TODO - dispatch express server initialized
  httpServer = server.listen(port);
  yield fork(createSocketIOSaga(io(httpServer)));
  console.log(`HTTP server listening on port ${port}`);  
}