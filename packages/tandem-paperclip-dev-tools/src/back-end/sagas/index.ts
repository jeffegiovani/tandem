import { fork, take } from "redux-saga/effects";
import * as express from "express";
import { expresssServerSaga } from "./express-server";
import { routesSaga } from "./routes";
import { uriWatcherSaga } from "./uri-watcher";

export function* mainSaga() {
  yield fork(expresssServerSaga);
  yield fork(routesSaga);
  yield fork(uriWatcherSaga);
}

