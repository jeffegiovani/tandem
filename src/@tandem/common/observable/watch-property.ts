import { IObservable } from "./base";
import { Observable } from "./core";
import { IDisposable } from "../object";
import { IDispatcher } from "@tandem/mesh";
import { PropertyMutation, MutationEvent, CoreEvent } from "@tandem/common/messages";

export type propertyChangeCallbackType = (newValue: any, oldValue: any) => void;


export class PropertyWatcher<T extends Observable, U> extends Observable {
  private _currentValue: U;
  private _observer: IDispatcher<any, any>;
  private _listening: boolean;

  constructor(readonly target: T, readonly propertyName: string) {
    super();
    this._currentValue = target[propertyName];
  }  

  get currentValue() {
    return this._currentValue;
  }

  connect(listener: (newValue: U, oldValue?: U) => any) {

    if (!this._listening) {
      this._listening = true;
      this.target.observe(this._observer = { dispatch: this.onEvent });
    }

    let currentValue = this.currentValue;

    const observer = { 
      dispatch: (event: MutationEvent<any>) => {
        if (this.currentValue !== currentValue) {
          const oldValue = currentValue;
          currentValue = this.currentValue;
          listener(this.currentValue, oldValue);
        }
      }
    };

    this.observe(observer);

    return {
      trigger() {
        listener(currentValue);
        return this;
      },
      dispose: () => {
        this.unobserve(observer);
      }
    }
  }

  onEvent = ({ mutation }: MutationEvent<any>) => {
    if (mutation && mutation.type === PropertyMutation.PROPERTY_CHANGE && (<PropertyMutation<any>>mutation).name === this.propertyName && mutation.target === this.target) {
      const oldValue = this._currentValue;
      this._currentValue = (<PropertyMutation<any>>mutation).newValue;
      this.notify(new PropertyMutation(PropertyMutation.PROPERTY_CHANGE, this, "currentValue", this._currentValue, oldValue).toEvent());
    }
  }
}


// DEPRECATED - use PropertyWatcher instead
export function watchProperty(target: any, property: string, callback: propertyChangeCallbackType) {

  const observer = {
    dispatch({ mutation }: MutationEvent<any>) {
      if (mutation && mutation.type === PropertyMutation.PROPERTY_CHANGE) {
        const propertyMutation = <PropertyMutation<any>>mutation; 
        if (propertyMutation.name === property && propertyMutation.target === target) {
          callback(propertyMutation.newValue, propertyMutation.oldValue);
        }
      }
    }
  };

  if (target.observe) {
    (<IObservable>target).observe(observer);
  }

  const ret = {
    dispose: () => {
      if (target.unobserve) target.unobserve(observer);
    },
    trigger: () => {
      if (target[property] != null) {
        callback(target[property], undefined);
      }
      return ret;
    }
  };

  return ret;
}

export function watchPropertyOnce(target: any, property: string, callback: propertyChangeCallbackType) {

  const watcher = watchProperty(target, property, (newValue: any, oldValue: any) => {
    watcher.dispose();
    callback(newValue, oldValue);
  });

  return {
    dispose: () => watcher.dispose(),
    trigger: () => watcher.trigger()
  }
}

export function bindProperty(source: IObservable, sourceProperty: string, target: any, destProperty: string = sourceProperty) {
  return watchProperty(source, sourceProperty, (newValue, oldValue) => {
    target[destProperty] = newValue;
  }).trigger();
}

export function waitForPropertyChange(target: IObservable, property: string, filter: (value) => boolean = () => true) {
  return new Promise((resolve, reject) => {
    const watcher = watchProperty(target, property, (newValue) => {
      if (filter(newValue)) {
        resolve();
        watcher.dispose();
      }
    });
  });
}
