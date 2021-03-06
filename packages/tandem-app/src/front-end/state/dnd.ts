import { StructReference } from "aerial-common2";
import * as React from "react";
import { dndStarted, dndEnded } from "../actions";

export type DNDState = {
  draggingRefs: StructReference[];
}

export type ConnectDragSource = (element: React.ReactElement<any>) => React.ReactElement<any>;

export type DragSourceHandler = {
  getData: (props) => StructReference;
};

export const withDragSource = <TInner, TOuter>(handler: DragSourceHandler) => (BaseComponent: React.ComponentClass) => {
  class DraggableComponentClass extends React.Component {
    render() {
      return React.createElement(BaseComponent, {
        connectDragSource: (element: React.ReactElement<any>) => {
          return React.cloneElement(element, {
            draggable: true,
            onDragStart: (event) => (this.props as any).dispatch(dndStarted(handler.getData(this.props), event)),
            onDragEnd: (event) => (this.props as any).dispatch(dndEnded(handler.getData(this.props), event)),
          })
        },
        ...(this.props as any)
      });
    }
  }

  return DraggableComponentClass;
}