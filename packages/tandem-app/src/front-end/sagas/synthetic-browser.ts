import { uniq } from "lodash";
import { delay } from "redux-saga";
import { createDeferredPromise } from "mesh";
import { apiWatchUris } from "../utils";
import { take, fork, select, put, call, spawn } from "redux-saga/effects";
import { Point, shiftPoint, watch, resized, Bounds, REMOVED, diffArray, ARRAY_UPDATE } from "aerial-common2";
import { 
  SYNTHETIC_WINDOW,
  syntheticWindowScroll,
  openSyntheticWindowRequest,
  SEnvCSSStyleDeclarationInterface,  
  SyntheticCSSStyleDeclaration,
  getSyntheticWindowChild,
  getSyntheticWindowChildStructs,
  SEnvHTMLElementInterface,
  createSetElementAttributeMutation,
  SEnvCSSStyleRuleInterface,
  cssStyleDeclarationSetProperty,
  SEnvCSSRuleInterface,
  deferApplyFileMutationsRequest,
  getSyntheticNodeWindow, 
  SYNTHETIC_WINDOW_OPENED,
  SEnvNodeTypes,
  SYNTHETIC_WINDOW_CLOSED,
  SYNTHETIC_WINDOW_LOADED,
  SYNTHETIC_WINDOW_CHANGED,
  SYNTHETIC_WINDOW_PROXY_OPENED,
  syntheticNodeTextContentChanged, 
  syntheticNodeValueStoppedEditing,
} from "aerial-browser-sandbox";
import { 
  ApplicationState,
  getWorkspaceById,
  getStageTranslate,
  getSyntheticWindow,
  getSelectedWorkspace, 
  getSyntheticNodeWorkspace, 
  getSyntheticWindowWorkspace,
  getSyntheticBrowser
} from "front-end/state";
import { 
  LOADED_SAVED_STATE,
  EMPTY_WINDOWS_URL_ADDED,
  EmptyWindowsUrlAdded,
  StageToolEditTextBlur,
  DELETE_SHORCUT_PRESSED, 
  StageToolEditTextChanged, 
  STAGE_TOOL_EDIT_TEXT_BLUR, 
  StageToolOverlayMousePanEnd,
  StageToolEditTextKeyDown,
  StageToolOverlayMousePanning,
  StageToolOverlayMousePanStart,
  FULL_SCREEN_SHORTCUT_PRESSED,
  STAGE_TOOL_EDIT_TEXT_CHANGED, 
  STAGE_TOOL_EDIT_TEXT_KEY_DOWN,
  FULL_SCREEN_TARGET_DELETED,
  VISUAL_EDITOR_WHEEL,
  StageWheel,
  CSS_DECLARATION_NAME_CHANGED,
  CSSDeclarationChanged,
  CSS_DECLARATION_VALUE_CHANGED,
  FILE_CHANGED,
  FileChanged,
  CSS_DECLARATION_CREATED,
  WINDOW_SELECTION_SHIFTED,
  STAGE_TOOL_OVERLAY_MOUSE_PANNING,
  STAGE_TOOL_OVERLAY_MOUSE_PAN_END,
  STAGE_TOOL_OVERLAY_MOUSE_PAN_START
} from "front-end/actions";

export function* frontEndSyntheticBrowserSaga() {
  yield fork(handleTextEditBlur);
  yield fork(handleWindowMousePanned);
  yield fork(handleFullScreenWindow);
  yield fork(handleScrollInFullScreenMode);
  yield fork(handleTextEditorEscaped);
  yield fork(handleEmptyWindowsUrlAdded);
  yield fork(handleLoadedSavedState);
  yield fork(handleCSSDeclarationChanges);
  yield fork(handleWatchWindowResource);
  yield fork(handleFileChanged);
}

function* handleEmptyWindowsUrlAdded() {
  while(true) {
    const {url}: EmptyWindowsUrlAdded = yield take(EMPTY_WINDOWS_URL_ADDED);
    const state: ApplicationState = yield select();
    yield put(openSyntheticWindowRequest({ location: url }, getSelectedWorkspace(state).browserId));
  }
}

function* handleWatchWindowResource() {
  let watchingUris: string[] = [];

  while(true) {
    const action = yield take([
      SYNTHETIC_WINDOW_CHANGED,
      SYNTHETIC_WINDOW_LOADED,
      SYNTHETIC_WINDOW_CLOSED,
      REMOVED
    ]);
    const state: ApplicationState = yield select();
    const allUris = uniq(state.browserStore.records.reduce((a, b) => {
      return [...a, ...b.windows.reduce((a2, b2) => {
        return [...a2, ...b2.externalResourceUris ];
      }, [])];
    }, [])) as string[];
    

    const updates = diffArray(allUris, watchingUris, (a, b) => a === b ? 0 : -1).mutations.filter((mutation) => mutation.$type === ARRAY_UPDATE);

    // no changes, so just continue
    if (updates.length === allUris.length) {
      continue;
    }

    yield spawn(function*() {
      yield call(apiWatchUris, watchingUris = allUris, state);
    });
  }
}

function* handleTextEditorEscaped() {
  while(true) {
    const { sourceEvent, nodeId } = (yield take(STAGE_TOOL_EDIT_TEXT_KEY_DOWN)) as StageToolEditTextKeyDown;
    if (sourceEvent.key !== "Escape") {
      continue;
    }
    yield call(applyTextEditChanges, sourceEvent, nodeId);

    // blur does _not_ get fired on escape.
    yield call(nodeValueStoppedEditing, nodeId);
  }
}

function* applyTextEditChanges(sourceEvent: React.SyntheticEvent<any>, nodeId: string) {
  const state = yield select();
  const window = getSyntheticNodeWindow(state, nodeId);
  const text = String((sourceEvent.target as any).textContent || "").trim();
  const workspace = getSyntheticNodeWorkspace(state, nodeId);
  yield put(syntheticNodeTextContentChanged(window.$id, nodeId, text));
}

function* handleTextEditBlur() {
  while(true) {
    const { sourceEvent, nodeId } = (yield take(STAGE_TOOL_EDIT_TEXT_BLUR)) as StageToolEditTextBlur;
    yield call(applyTextEditChanges, sourceEvent, nodeId);    
    yield call(nodeValueStoppedEditing, nodeId);
  }
}

function* nodeValueStoppedEditing(nodeId: string) {
  const state = yield select();
  const window = getSyntheticNodeWindow(state, nodeId);
  yield put(syntheticNodeValueStoppedEditing(window.$id, nodeId));
}

const MOMENTUM_THRESHOLD = 100;
const DEFAULT_MOMENTUM_DAMP = 0.1;
const MOMENTUM_DELAY = 50;
const VELOCITY_MULTIPLIER = 10;

function* handleScrollInFullScreenMode() {
  while(true) {
    const { deltaX, deltaY } = (yield take(VISUAL_EDITOR_WHEEL)) as StageWheel;
    const state: ApplicationState = (yield select());
    const workspace = getSelectedWorkspace(state);
    if (!workspace.stage.fullScreen) {
      continue;
    }
    
    const window = getSyntheticWindow(state, workspace.stage.fullScreen.windowId);

    yield put(syntheticWindowScroll(window.$id, shiftPoint(window.scrollPosition || { left: 0, top: 0 }, {
      left: 0,
      top: deltaY
    })));
  }
}

function* handleFileChanged() {
  while(true) {
    const { filePath }: FileChanged = yield take(FILE_CHANGED);
    const state: ApplicationState = yield select();
    const workspace = getSelectedWorkspace(state);
    const windows = getSyntheticBrowser(state, workspace.browserId).windows;

    for (const window of windows) {
      const shouldReload = window.externalResourceUris.find((uri) => (
        uri.indexOf(filePath) !== -1
      ));

      if (shouldReload) {
        console.debug("Reloading window ", window.location);
        window.instance.location.reload();
      }
    }
  }
}

function* handleLoadedSavedState() {
  while(true) {
    yield take(LOADED_SAVED_STATE);
    const state: ApplicationState = yield select();
    const workspace = getSelectedWorkspace(state);
    const browser = getSyntheticBrowser(state, workspace.browserId);
    for (const window of browser.windows) {
      yield put(openSyntheticWindowRequest(window, browser.$id));
    }
  }
}

function* persistDeclarationChange(declaration: SEnvCSSStyleDeclarationInterface, name: string, value: string) {

  const owner = declaration.$owner;
  
  // persist it
  if ((owner as SEnvHTMLElementInterface).nodeType === SEnvNodeTypes.ELEMENT) {
    const element = owner as SEnvHTMLElementInterface;
    const mutation = createSetElementAttributeMutation(element as any, "style", element.getAttribute("style"));
    yield put(deferApplyFileMutationsRequest(mutation));
  } else {
    const mutation = cssStyleDeclarationSetProperty(declaration, name, value);
    yield put(deferApplyFileMutationsRequest(mutation));
  }
}

// TODO - move this to synthetic browser
function* handleCSSDeclarationChanges() {
  yield fork(function* handleNameChanges() {
    while(true) {
      const { value, windowId, declarationId }: CSSDeclarationChanged = yield take(CSS_DECLARATION_NAME_CHANGED);
      const state: ApplicationState = yield select();
      const window = getSyntheticWindow(state, windowId);
    }
  });
  
  yield fork(function* handleValueChanges() {

    // TODO - consider disabled properties here
    while(true) {
      const { name, value, windowId, declarationId }: CSSDeclarationChanged = yield take(CSS_DECLARATION_VALUE_CHANGED);
      const state: ApplicationState = yield select();
      const window = getSyntheticWindow(state, windowId);
      const declaration: SEnvCSSStyleDeclarationInterface = (getSyntheticWindowChild(window, declarationId) as SyntheticCSSStyleDeclaration).instance;
      declaration

      // null or ""
      if (!value) {
        declaration.removeProperty(name);
      } else {
        declaration.setProperty(name, value);
      }

      yield call(persistDeclarationChange, declaration, name, value);
    }
  });
  
  yield fork(function* handleNewDeclaration() {
    while(true) {
      const { name, value, windowId, declarationId }: CSSDeclarationChanged = yield take(CSS_DECLARATION_CREATED);
      const state: ApplicationState = yield select();
      const window = getSyntheticWindow(state, windowId);
      const declaration: SEnvCSSStyleDeclarationInterface = (getSyntheticWindowChild(window, declarationId) as SyntheticCSSStyleDeclaration).instance;
      declaration.setProperty(name, value);

      yield call(persistDeclarationChange, declaration, name, value);
    }
  });
}

// fugly quick momentum scrolling implementation
function* handleWindowMousePanned() {

  let deltaTop  = 0;
  let deltaLeft = 0;
  let currentWindowId: string;
  let panStartScrollPosition: Point;
  let lastPaneEvent: StageToolOverlayMousePanning;

  yield fork(function*() {
    while(true) {
      const { windowId } = (yield take(STAGE_TOOL_OVERLAY_MOUSE_PAN_START)) as StageToolOverlayMousePanStart;
      panStartScrollPosition = getSyntheticWindow(yield select(), windowId).scrollPosition || { left: 0, top: 0 };
    }
  });

  function* scrollDelta(windowId, deltaY) {
    yield put(syntheticWindowScroll(windowId, shiftPoint(panStartScrollPosition, {
      left: 0,
      top: -deltaY
    })));
  }

  yield fork(function*() {
    while(true) {
      const event = lastPaneEvent = (yield take(STAGE_TOOL_OVERLAY_MOUSE_PANNING)) as StageToolOverlayMousePanning;
      const { windowId, deltaY, center, velocityY: newVelocityY } = event;

      const zoom = getStageTranslate(getSelectedWorkspace(yield select()).stage).zoom;

      yield scrollDelta(windowId, deltaY / zoom);
    }
  });
  
  yield fork(function*() {
    while(true) {
      yield take(STAGE_TOOL_OVERLAY_MOUSE_PAN_END);
      const { windowId, deltaY, velocityY } = lastPaneEvent;

      const zoom = getStageTranslate(getSelectedWorkspace(yield select()).stage).zoom;
      
      yield spring(deltaY, velocityY * VELOCITY_MULTIPLIER, function*(deltaY) {
        yield scrollDelta(windowId, deltaY / zoom);
      });
    }
  });
}

const WINDOW_SYNC_MS = 1000 / 30;

function* handleFullScreenWindow() {

  let currentFullScreenWindowId: string;
  let previousWindowBounds: Bounds;
  let waitForFullScreenMode = createDeferredPromise();

  yield fork(function*() {
    while(true) {

      // TODO - possibly change to WINDOW_SCOPE_CHANGED
      yield take([FULL_SCREEN_SHORTCUT_PRESSED, SYNTHETIC_WINDOW_PROXY_OPENED, WINDOW_SELECTION_SHIFTED, FULL_SCREEN_TARGET_DELETED]);
      const state: ApplicationState = yield select();
      const workspace = getSelectedWorkspace(state);
      const windowId = workspace.stage.fullScreen && workspace.stage.fullScreen.windowId;

      if (currentFullScreenWindowId) {
        yield put(resized(currentFullScreenWindowId, SYNTHETIC_WINDOW, previousWindowBounds));
        previousWindowBounds = undefined;
        currentFullScreenWindowId = undefined;
        // TODO - revert window size
        waitForFullScreenMode = createDeferredPromise();
      }

      if (windowId) {
        const window = getSyntheticWindow(state, windowId);
        previousWindowBounds = workspace.stage.fullScreen.originalWindowBounds;
        waitForFullScreenMode.resolve(true);
      }
      
      currentFullScreenWindowId = windowId;
    }
  });

  yield fork(function* syncFullScreenWindowSize() {
    while(true) {
      yield call(() => waitForFullScreenMode.promise);
      const state: ApplicationState = yield select();
      const workspace = getSelectedWorkspace(state);
      const { container } = workspace.stage;
      const rect = container.getBoundingClientRect();
      const window = getSyntheticWindow(state, currentFullScreenWindowId);
      yield put(resized(currentFullScreenWindowId, SYNTHETIC_WINDOW, {
        left: window.bounds.left,
        top: window.bounds.top,
        right: window.bounds.left + rect.width,
        bottom: window.bounds.top + rect.height,
      }));
      yield call(() => new Promise(resolve => setTimeout(resolve, WINDOW_SYNC_MS)));
    }
  });
}



function* spring(start: number, velocityY: number, iterate: Function, damp: number = DEFAULT_MOMENTUM_DAMP, complete: Function = () => {}) {
  let i = 0;
  let v = velocityY;
  let currentValue = start;
  function* tick() {
    i += damp;
    currentValue += velocityY / (i / 1);
    if (i >= 1) {
      return complete();
    }
    yield iterate(currentValue);
    yield call(delay, MOMENTUM_DELAY);
    yield tick();
  }
  yield tick();
}
