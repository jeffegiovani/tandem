import { 
  IDd,
  moved,
  update,
  Bounds,
  Struct,
  removed,
  resized,
  updateIn, 
  Translate,
  BaseEvent, 
  zoomBounds,
  moveBounds,
  mergeBounds,
  mapImmutable, 
  WrappedEvent,
  getBoundsSize,
  boundsFromRect,
  boundsIntersect,
  StructReference,
  scaleInnerBounds,
  keepBoundsCenter,
  getSmallestBounds,
  getStructReference,
  centerTransformZoom,
  pointIntersectsBounds,
  keepBoundsAspectRatio,
} from "aerial-common2";

import { clamp, merge } from "lodash";
import { 
  FileCacheItem, 
  fileCacheReducer,
  updateFileCacheItem,
  getFileCacheItemByUri, 
} from "aerial-sandbox2";

import { 
  Workspace,
  updateWorkspace,
  getWorkspaceById,
  ApplicationState,
  SyntheticWindow,
  getStageTranslate,
  ShortcutServiceState,
  updateWorkspaceStage,
  getSelectedWorkspace,
  addWorkspaceSelection,
  setWorkspaceSelection,
  createApplicationState,
  showWorkspaceTextEditor,
  clearWorkspaceSelection,
  removeWorkspaceSelection,
  toggleWorkspaceSelection,
  getSelectedWorkspaceFile,
  getSyntheticNodeWorkspace,
  getSyntheticWindowBrowser,
  updateWorkspaceTextEditor,
  getSyntheticBrowserBounds,
  getFrontEndItemByReference,
  getWorkspaceSelectionBounds,
  getSyntheticWindowWorkspace,
  getBoundedWorkspaceSelection,
  getSyntheticBrowserItemBounds,
  toggleWorkspaceTargetCSSSelector,
  getStageToolMouseNodeTargetReference,
} from "front-end/state";

import {
  NATIVE_COMPONENTS
} from "../constants";

import {
  StageWheel,
  StageMounted,
  ResizerMoved,
  TOGGLE_TOOLS_SHORTCUT_PRESSED,
  RESIZER_MOVED,
  STAGE_MOUNTED,
  ResizerMouseDown,
  DND_STARTED,
  DND_ENDED,
  DND_HANDLED,
  DNDEvent,
  ResizerPathMoved,
  STAGE_MOUSE_MOVED,
  LoadedSavedState,
  LOADED_SAVED_STATE,
  RESIZER_MOUSE_DOWN,
  BreadcrumbItemClicked,
  BreadcrumbItemMouseEnterLeave,
  BREADCRUMB_ITEM_CLICKED,
  STAGE_MOUSE_CLICKED,
  VISUAL_EDITOR_WHEEL,
  PromptedNewWindowUrl,
  TreeNodeLabelClicked,
  WindowPaneRowClicked,
  SelectorDoubleClicked,
  DeleteShortcutPressed,
  StageWillWindowKeyDown,
  BREADCRUMB_ITEM_MOUSE_ENTER,
  BREADCRUMB_ITEM_MOUSE_LEAVE,
  CSS_DECLARATION_TITLE_MOUSE_ENTER,
  CSS_DECLARATION_TITLE_MOUSE_LEAVE,
  CSSDeclarationTitleMouseLeaveEnter,
  DELETE_SHORCUT_PRESSED,
  PROMPTED_NEW_WINDOW_URL,
  KEYBOARD_SHORTCUT_ADDED,
  WindowSelectionShifted,
  WINDOW_SELECTION_SHIFTED,
  ESCAPE_SHORTCUT_PRESSED,
  CANVAS_MOTION_RESTED,
  NEXT_WINDOW_SHORTCUT_PRESSED,
  PREV_WINDOW_SHORTCUT_PRESSED,
  TOGGLE_TARGET_CSS_TARGET_SELECTOR_CLICKED,
  ToggleCSSTargetSelectorClicked,
  EMPTY_WINDOWS_URL_ADDED,
  RESIZER_STOPPED_MOVING,
  SELECTOR_DOUBLE_CLICKED,
  StageToolOverlayClicked,
  TREE_NODE_LABEL_CLICKED,
  WINDOW_PANE_ROW_CLICKED,
  RESIZER_PATH_MOUSE_MOVED,
  StageToolEditTextKeyDown,
  StageToolEditTextChanged,
  ZOOM_IN_SHORTCUT_PRESSED,
  WorkspaceSelectionDeleted,
  ZOOM_OUT_SHORTCUT_PRESSED,
  FULL_SCREEN_TARGET_DELETED,
  TOGGLE_LEFT_GUTTER_PRESSED,
  StageToolOverlayMouseMoved,
  TOGGLE_TEXT_EDITOR_PRESSED,
  WORKSPACE_DELETION_SELECTED,
  StageWillWindowTitleClicked,
  TOGGLE_RIGHT_GUTTER_PRESSED,
  StageToolOverlayMousePanEnd,
  StageToolNodeOverlayClicked,
  FULL_SCREEN_SHORTCUT_PRESSED,
  StageToolNodeOverlayHoverOut,
  STAGE_TOOL_EDIT_TEXT_CHANGED,
  StageToolNodeOverlayHoverOver,
  STAGE_TOOL_EDIT_TEXT_KEY_DOWN,
  StageToolOverlayMousePanStart,
  API_COMPONENTS_LOADED,
  APIComponentsLoaded,
  STAGE_TOOL_OVERLAY_MOUSE_LEAVE,
  STAGE_TOOL_WINDOW_TITLE_CLICKED,
  STAGE_TOOL_OVERLAY_MOUSE_PAN_END,
  RESIZER_PATH_MOUSE_STOPPED_MOVING,
  STAGE_TOOL_OVERLAY_MOUSE_PAN_START,
  CanvasElementsComputedPropsChanged,
  STAGE_TOOL_WINDOW_BACKGROUND_CLICKED,
  CANVAS_ELEMENTS_COMPUTED_PROPS_CHANGED,
  FILE_NAVIGATOR_ADD_FILE_BUTTON_CLICKED,
  STAGE_TOOL_OVERLAY_MOUSE_DOUBLE_CLICKED,
  FILE_NAVIGATOR_ADD_FOLDER_BUTTON_CLICKED,
} from "front-end/actions";

import { 
  SyntheticNode,
  SYNTHETIC_WINDOW,
  getSyntheticWindow, 
  getSyntheticBrowser,
  SYNTHETIC_ELEMENT,
  getMatchingElements,
  DEFAULT_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
  getSyntheticNodeById,
  SyntheticCSSStyleRule,
  SyntheticWindowOpened,
  getSyntheticNodeWindow,
  syntheticBrowserReducer, 
  getSyntheticWindowChild,
  SEnvCSSStyleRuleInterface,
  openSyntheticWindowRequest,
  SyntheticCSSStyleDeclaration,
  SYNTHETIC_WINDOW_PROXY_OPENED,
  SEnvCSSStyleDeclarationInterface,
} from "aerial-browser-sandbox";

import reduceReducers = require("reduce-reducers");

export const applicationReducer = (state: ApplicationState = createApplicationState(), event: BaseEvent) => {
  switch(event.type) {
    
    case LOADED_SAVED_STATE: {
      const { state: newState } = event as LoadedSavedState;
      return merge({}, state, JSON.parse(JSON.stringify(newState)));
    }
    
    case TREE_NODE_LABEL_CLICKED: {
      const { node } = event as TreeNodeLabelClicked;
      return updateWorkspace(state, state.selectedWorkspaceId, {
        selectedFileId: node.$id
      });
    }

    case TOGGLE_TARGET_CSS_TARGET_SELECTOR_CLICKED: {
      const { itemId, windowId } = event as ToggleCSSTargetSelectorClicked;
      const window = getSyntheticWindow(state, windowId);
      const item = getSyntheticWindowChild(window, itemId);
      const workspace = getSyntheticWindowWorkspace(state, window.$id);
      state = toggleWorkspaceTargetCSSSelector(state, workspace.$id, item.source.uri, (item as SyntheticCSSStyleRule).selectorText);
      return state;
    }
  }
  
  // state = canvasReducer(state, event);
  // state = syntheticBrowserReducer(state, event);
  state = syntheticBrowserReducer(state, event);
  state = stageReducer(state, event);
  state = windowPaneReducer(state, event);
  state = fileCacheReducer(state, event);
  state = shortcutReducer(state, event);
  state = apiReducer(state, event);
  state = dndReducer(state, event);

  return state;
};

const PANE_SENSITIVITY = process.platform === "win32" ? 0.1 : 1;
const ZOOM_SENSITIVITY = process.platform === "win32" ? 2500 : 250;
const MIN_ZOOM = 0.02;
const MAX_ZOOM = 6400 / 100;
const INITIAL_ZOOM_PADDING = 50;

const apiReducer = (state: ApplicationState, event: BaseEvent) => {
  switch(event.type) {
    case API_COMPONENTS_LOADED: {
      const { components } = event as APIComponentsLoaded;
      return updateWorkspace(state, state.selectedWorkspaceId, {
        availableComponents: [
          ...NATIVE_COMPONENTS,
          ...components
        ]
      });
    }
  }
  return state;
};

const shortcutReducer = (state: ApplicationState, event: BaseEvent) => {
  switch(event.type) {
    case TOGGLE_LEFT_GUTTER_PRESSED: {
      const workspace = getSelectedWorkspace(state);
      return updateWorkspaceStage(state, workspace.$id, {
        showLeftGutter: !workspace.stage.showLeftGutter
      });
    }

    case ESCAPE_SHORTCUT_PRESSED: {
      const workspace = getSelectedWorkspace(state);
      return updateWorkspace(state, workspace.$id, {
        selectionRefs: []
      });
    }

    case ZOOM_IN_SHORTCUT_PRESSED: {
      const workspace = getSelectedWorkspace(state);
      if (workspace.stage.fullScreen) return state;
      return setStageZoom(state, workspace.$id, normalizeZoom(workspace.stage.translate.zoom) * 2);
    }

    case ZOOM_OUT_SHORTCUT_PRESSED: {
      const workspace = getSelectedWorkspace(state);
      if (workspace.stage.fullScreen) return state;
      return setStageZoom(state, workspace.$id, normalizeZoom(workspace.stage.translate.zoom) / 2);
    }

    case PREV_WINDOW_SHORTCUT_PRESSED: {
      return state;
    }

    case FULL_SCREEN_TARGET_DELETED: {
      return unfullscreen(state);
    }
    
    case FULL_SCREEN_SHORTCUT_PRESSED: {
      const workspace = getSelectedWorkspace(state);
      const selection = workspace.selectionRefs[0];

      const windowId = selection ? selection[0] === SYNTHETIC_WINDOW ? selection[1] : getSyntheticNodeWindow(state, selection[1]) && getSyntheticNodeWindow(state, selection[1]).$id : null;

      if (windowId && !workspace.stage.fullScreen) {
        const window = getSyntheticWindow(state, windowId);
        state = updateWorkspaceStage(state, workspace.$id, {
          smooth: true,
          fullScreen: {
            windowId: windowId,
            originalTranslate: workspace.stage.translate,
            originalWindowBounds: window.bounds
          },
          translate: {
            zoom: 1,
            left: -window.bounds.left,
            top: -window.bounds.top
          }
        });
        return state;
      } else if (workspace.stage.fullScreen) {
        return unfullscreen(state);
      } else {
        return state;
      }
    }

    case CANVAS_MOTION_RESTED: {
      const workspace = getSelectedWorkspace(state);
      return updateWorkspaceStage(state, workspace.$id, {
        smooth: false
      });
    }
    
    case TOGGLE_TEXT_EDITOR_PRESSED: {
      const workspace = getSelectedWorkspace(state);
      return updateWorkspaceStage(state, workspace.$id, {
        showTextEditor: !workspace.stage.showTextEditor
      });
    }

    case TOGGLE_RIGHT_GUTTER_PRESSED: {
      const workspace = getSelectedWorkspace(state);
      return updateWorkspaceStage(state, workspace.$id, {
        showRightGutter: !workspace.stage.showRightGutter
      });
    }
  }
  return state;
}

const dndReducer = (state: ApplicationState, event: BaseEvent) => {
  switch(event.type) {
    case DND_STARTED: {
      const { ref }  = event as DNDEvent;
      return updateWorkspace(state, state.selectedWorkspaceId, {
        draggingRefs: [ref]
      })
    }
    case DND_HANDLED: {
      return updateWorkspace(state, state.selectedWorkspaceId, {
        draggingRefs: []
      });
    }
  }
  return state;
}

const stageReducer = (state: ApplicationState, event: BaseEvent) => {

  switch(event.type) {
    case VISUAL_EDITOR_WHEEL: {
      const { workspaceId, metaKey, ctrlKey, deltaX, deltaY, canvasHeight, canvasWidth } = event as StageWheel;
      const workspace = getWorkspaceById(state, workspaceId);

      if (workspace.stage.fullScreen) {
        return state;
      }
      
      let translate = getStageTranslate(workspace.stage);

      if (metaKey || ctrlKey) {
        translate = centerTransformZoom(translate, boundsFromRect({
          width: canvasWidth,
          height: canvasHeight
        }), clamp(translate.zoom + translate.zoom * deltaY / ZOOM_SENSITIVITY, MIN_ZOOM, MAX_ZOOM), workspace.stage.mousePosition);
      } else {
        translate = {
          ...translate,
          left: translate.left - deltaX,
          top: translate.top - deltaY
        };
      }

      return updateWorkspaceStage(state, workspace.$id, { smooth: false, translate });
    }

    case TOGGLE_TOOLS_SHORTCUT_PRESSED: {
      const workspace = getSelectedWorkspace(state);
      return updateWorkspaceStage(state, workspace.$id, {
        showTools: workspace.stage.showTools == null ? false : !workspace.stage.showTools
      })
    }

    case STAGE_TOOL_EDIT_TEXT_KEY_DOWN: {
      const { sourceEvent, nodeId } = event as StageToolEditTextKeyDown;
      if (sourceEvent.key === "Escape") {
        const workspace = getSyntheticNodeWorkspace(state, nodeId);
        state = setWorkspaceSelection(state, workspace.$id, getStructReference(getSyntheticNodeById(state, nodeId)));
        state = updateWorkspaceStage(state, workspace.$id, {
          secondarySelection: false
        });
      }
      return state;
    }

    case RESIZER_PATH_MOUSE_MOVED: 
    case RESIZER_MOVED: {
      const workspace = getSelectedWorkspace(state);
      state = updateWorkspaceStage(state, workspace.$id, {
        movingOrResizing: true
      });
      return state;
    }

    case RESIZER_PATH_MOUSE_STOPPED_MOVING: 
    case RESIZER_STOPPED_MOVING: {
      const workspace = getSelectedWorkspace(state);
      state = updateWorkspaceStage(state, workspace.$id, {
        movingOrResizing: false
      });
      return state;
    }

    case SYNTHETIC_WINDOW_PROXY_OPENED: {
      const { instance } = event as SyntheticWindowOpened;
      return selectAndCenterSyntheticWindow(state, instance.struct);
    }

    case STAGE_TOOL_OVERLAY_MOUSE_LEAVE: {
      const { sourceEvent } = event as StageToolOverlayMouseMoved;
      return updateWorkspace(state, state.selectedWorkspaceId, {
        hoveringRefs: []
      });
    }

    case CSS_DECLARATION_TITLE_MOUSE_ENTER: {
      const { windowId, ruleId } = event as CSSDeclarationTitleMouseLeaveEnter;
      const window = getSyntheticWindow(state, windowId);
      const { selectorText }: SEnvCSSStyleRuleInterface = getSyntheticWindowChild(window, ruleId);
      return updateWorkspace(state, state.selectedWorkspaceId, {
        hoveringRefs: getMatchingElements(window, selectorText).map((element) => [
          element.$type,
          element.$id
        ]) as [[string, string]]
      });
    }

    case CSS_DECLARATION_TITLE_MOUSE_LEAVE: {
      const { windowId, ruleId } = event as CSSDeclarationTitleMouseLeaveEnter;
      return updateWorkspace(state, state.selectedWorkspaceId, {
        hoveringRefs: []
      });
    }

    case RESIZER_MOUSE_DOWN: {
      const { sourceEvent, workspaceId } = event as ResizerMouseDown;
      const metaKey = sourceEvent.metaKey || sourceEvent.ctrlKey;
      const workspace = getWorkspaceById(state, workspaceId);

      if (metaKey && workspace.selectionRefs.length === 1) {
        state = setSelectedFileFromNodeId(state, workspace.$id, workspace.selectionRefs[0][1]);
      }

      return state;
    }

    case BREADCRUMB_ITEM_CLICKED: {
      const { windowId, nodeId } = event as BreadcrumbItemClicked;
      const window = getSyntheticWindow(state, windowId);
      const browser = getSyntheticWindowBrowser(state, window.$id);
      const node = getSyntheticNodeById(browser, nodeId);
      const workspace = getSyntheticWindowWorkspace(state, window.$id);
      return setWorkspaceSelection(state, workspace.$id, [node.$type, node.$id]);
    }

    case BREADCRUMB_ITEM_MOUSE_ENTER: {
      const { windowId, nodeId }  = event as BreadcrumbItemMouseEnterLeave;
      return updateWorkspace(state, state.selectedWorkspaceId, {
        hoveringRefs: [[SYNTHETIC_ELEMENT, nodeId]]
      });
    }

    case BREADCRUMB_ITEM_MOUSE_LEAVE: {
      const { windowId, nodeId }  = event as BreadcrumbItemMouseEnterLeave;
      return updateWorkspace(state, state.selectedWorkspaceId, {
        hoveringRefs: []
      });
    }

    case EMPTY_WINDOWS_URL_ADDED: {
      const workspaceId = state.selectedWorkspaceId;
      return centerStage(state, workspaceId, {
        left: 0,
        top: 0,
        right: DEFAULT_WINDOW_WIDTH,
        bottom: DEFAULT_WINDOW_HEIGHT
      }, false, true);
    }

    case STAGE_MOUNTED: {
      const { element } = event as StageMounted;

      const { width = 400, height = 300 } = element.getBoundingClientRect() || {};
      const workspaceId = state.selectedWorkspaceId;
      const workspace = getSelectedWorkspace(state);

      state = updateWorkspaceStage(state, workspaceId, { container: element });

      // do not center if in full screen mode
      if (workspace.stage.fullScreen) {
        return state;
      }

      const innerBounds = getSyntheticBrowserBounds(getSyntheticBrowser(state, workspace.browserId));

      // no windows loaded
      if (innerBounds.left + innerBounds.right + innerBounds.top + innerBounds.bottom === 0) {
        console.warn(`Stage mounted before windows have been loaded`);
        return state;
      }

      return centerStage(state, workspaceId, innerBounds, false, true);
    };

    case STAGE_TOOL_OVERLAY_MOUSE_PAN_START: {
      const { windowId } = event as StageToolOverlayMousePanStart;
      const workspace = getSyntheticWindowWorkspace(state, windowId);
      return updateWorkspaceStage(state, workspace.$id, { panning: true });
    }
    
    case STAGE_TOOL_OVERLAY_MOUSE_PAN_END: {
      const { windowId } = event as StageToolOverlayMousePanEnd;
      const workspace = getSyntheticWindowWorkspace(state, windowId)
      return updateWorkspaceStage(state, workspace.$id, { panning: false });
    }

    case STAGE_MOUSE_MOVED: {
      const { sourceEvent: { pageX, pageY }} = event as WrappedEvent<React.MouseEvent<any>>;
      state = updateWorkspaceStage(state, state.selectedWorkspaceId, {
        mousePosition: {
          left: pageX,
          top: pageY
        }
      });

      const workspace = getSelectedWorkspace(state);

      // TODO - in the future, we'll probably want to be able to highlight hovered nodes as the user is moving an element around to indicate where
      // they can drop the element. 
      const targetRef = workspace.stage.movingOrResizing ? null : getStageToolMouseNodeTargetReference(state, event as StageToolOverlayMouseMoved);

      state = updateWorkspace(state, state.selectedWorkspaceId, {
        hoveringRefs: targetRef ? [targetRef] : []
      });

      return state;
    };

    case STAGE_MOUSE_CLICKED: {
      const { sourceEvent } = event as StageToolNodeOverlayClicked;
      if (/textarea|input/i.test((sourceEvent.target as Element).nodeName)) {
        return state;
      }

      // alt key opens up a new link
      const altKey = sourceEvent.altKey;
      const workspace = getSelectedWorkspace(state);
      state = updateWorkspaceStageSmoothing(state, workspace);
      
      // do not allow selection while window is panning (scrolling)
      if (workspace.stage.panning || workspace.stage.movingOrResizing) return state;

      const targetRef = getStageToolMouseNodeTargetReference(state, event as StageToolNodeOverlayClicked);
      if (!targetRef) {
        return state;
      }

      if (altKey) {
        return setSelectedFileFromNodeId(state, workspace.$id, targetRef[1]);
      
      // meta key without any selected elements opens source. Already selected elements
      // = multi-selected
      } else if (!altKey) {
        state = handleWindowSelectionFromAction(state, targetRef, event as StageToolNodeOverlayClicked);
        state = updateWorkspaceStage(state, workspace.$id, {
          secondarySelection: false
        });
        return state;
      }
      return state;
    }

    case STAGE_TOOL_OVERLAY_MOUSE_DOUBLE_CLICKED: {
      const { sourceEvent, windowId } = event as StageToolNodeOverlayClicked;
      const workspace = getSyntheticWindowWorkspace(state, windowId);
      const targetRef = getStageToolMouseNodeTargetReference(state, event as StageToolNodeOverlayClicked);
      if (!targetRef) return state;      

      state = updateWorkspaceStage(state, workspace.$id, {
        secondarySelection: true
      });

      state = setWorkspaceSelection(state, workspace.$id, targetRef);

      return state;
    }

    case WINDOW_SELECTION_SHIFTED: {
      const { windowId } = event as WindowSelectionShifted;
      return selectAndCenterSyntheticWindow(state, getSyntheticWindow(state, windowId));
    }

    case SELECTOR_DOUBLE_CLICKED: {
      const { sourceEvent, item } = event as SelectorDoubleClicked;
      const workspace = getSyntheticNodeWorkspace(state, item.$id);
      state = updateWorkspaceStage(state, workspace.$id, {
        secondarySelection: true
      });
      state = setWorkspaceSelection(state, workspace.$id, getStructReference(item));
      return state;
    }

    case WORKSPACE_DELETION_SELECTED: {
      const { workspaceId } = event as WorkspaceSelectionDeleted;
      state = clearWorkspaceSelection(state, workspaceId);
      return state;
    }

    case STAGE_TOOL_WINDOW_TITLE_CLICKED: {
      state = updateWorkspaceStageSmoothing(state);
      return handleWindowSelectionFromAction(state, getStructReference(getSyntheticWindow(state, (event as WindowPaneRowClicked).windowId)), event as WindowPaneRowClicked);
    }

    case STAGE_TOOL_WINDOW_BACKGROUND_CLICKED: {
      const workspace = getSelectedWorkspace(state);
      return clearWorkspaceSelection(state, workspace.$id);
    }
  }

  return state;
}

const unfullscreen = (state: ApplicationState, workspaceId: string = state.selectedWorkspaceId) => {
  const workspace = getWorkspaceById(state, workspaceId);
  const { originalWindowBounds } = workspace.stage.fullScreen;
  state = updateWorkspaceStage(state, workspace.$id, {
    smooth: true,
    fullScreen: undefined
  });
  
  state = updateWorkspaceStage(state, workspace.$id, {
    translate: workspace.stage.fullScreen.originalTranslate,
    smooth: true
  });
  
  return state;
}

const selectAndCenterSyntheticWindow = (state: ApplicationState, window: SyntheticWindow) => {

  let workspace = getSelectedWorkspace(state);
  if (!workspace.stage.container) return state;

  const { width, height } = workspace.stage.container.getBoundingClientRect();

  state = centerStage(state, state.selectedWorkspaceId, window.bounds, true, workspace.stage.fullScreen ? workspace.stage.fullScreen.originalTranslate.zoom : true);

  // update translate
  workspace = getSelectedWorkspace(state);

  if (workspace.stage.fullScreen) {
    state = updateWorkspaceStage(state, workspace.$id, {
      smooth: true,
      fullScreen: {
        windowId: window.$id,
        originalTranslate: workspace.stage.translate,
        originalWindowBounds: window.bounds
      },
      translate: {
        zoom: 1,
        left: -window.bounds.left,
        top: -window.bounds.top
      }
    });
  }

  state = setWorkspaceSelection(state, workspace.$id, getStructReference(window));
  return state;
}

const centerStage = (state: ApplicationState, workspaceId: string, innerBounds: Bounds, smooth?: boolean, zoomOrZoomToFit?: boolean|number) => {
  const workspace = getWorkspaceById(state, workspaceId);
  const { stage: { container, translate }} = workspace;
  if (!container) return state;

  const { width, height } = container.getBoundingClientRect();

  const innerSize = getBoundsSize(innerBounds);

  const centered = {
    left: -innerBounds.left + width / 2 - (innerSize.width) / 2,
    top: -innerBounds.top + height / 2 - (innerSize.height) / 2,
  };

  const scale = typeof zoomOrZoomToFit === "boolean" ? Math.min(
    (width - INITIAL_ZOOM_PADDING) / innerSize.width,
    (height - INITIAL_ZOOM_PADDING) / innerSize.height
  ) : typeof zoomOrZoomToFit === "number" ? zoomOrZoomToFit : translate.zoom;

  return updateWorkspaceStage(state, workspaceId, {
    smooth,
    translate: centerTransformZoom({
      ...centered,
      zoom: 1
    }, { left: 0, top: 0, right: width, bottom: height }, scale)
  });
};

const handleWindowSelectionFromAction = <T extends { sourceEvent: React.MouseEvent<any>, windowId }>(state: ApplicationState, ref: StructReference, event: T) => {
  const { sourceEvent } = event;
  const workspace = getSelectedWorkspace(state);
  
  // meta key + no items selected should display source of 
  if (sourceEvent.metaKey && workspace.selectionRefs.length) {
    return toggleWorkspaceSelection(state, workspace.$id, ref);
  } else if(!sourceEvent.metaKey) {
    return setWorkspaceSelection(state, workspace.$id, ref);
  }
  return state;
}

const normalizeZoom = (zoom) => {
  return (zoom < 1 ? 1 / Math.round(1 / zoom) : Math.round(zoom));
};

const windowPaneReducer = (state: ApplicationState, event: BaseEvent) => {
  switch (event.type) {
    case WINDOW_PANE_ROW_CLICKED: {
      return handleWindowSelectionFromAction(state, getStructReference(getSyntheticWindow(state, (event as WindowPaneRowClicked).windowId)), event as WindowPaneRowClicked);
    }
  }
  return state;
};

const updateWorkspaceStageSmoothing = (state: ApplicationState, workspace?: Workspace) => {
  if (!workspace) workspace = getSelectedWorkspace(state);
  if (!workspace.stage.fullScreen && workspace.stage.smooth) {
    return updateWorkspaceStage(state, workspace.$id, {
      smooth: false
    });
  }
  return state;
};

const setStageZoom = (state: ApplicationState, workspaceId: string, zoom: number, smooth: boolean = true) => {
  const workspace = getWorkspaceById(state, workspaceId);
  return updateWorkspaceStage(state, workspace.$id, {
    smooth,
    translate: centerTransformZoom(
      workspace.stage.translate, workspace.stage.container.getBoundingClientRect(), 
      clamp(zoom, MIN_ZOOM, MAX_ZOOM),
      workspace.stage.mousePosition
    )
  });
};

const setSelectedFileFromNodeId = (state: ApplicationState, workspaceId: string, nodeId: string) => {
  const { source: { uri, start } } = getSyntheticNodeById(state, nodeId) as SyntheticNode;
  const fileCacheItem = getFileCacheItemByUri(state, uri);
  if (fileCacheItem) {
    state = updateWorkspace(state, workspaceId, {
      selectedFileId: fileCacheItem.$id,
    });
    state = updateWorkspaceTextEditor(state, workspaceId, {
      cursorPosition: start
    });
    return showWorkspaceTextEditor(state, workspaceId);
  }
  return state;
}