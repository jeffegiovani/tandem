import { decode } from "ent";
import { inject } from "sf-core/decorators";
import { HTMLFile } from "sf-html-extension/models/html-file";
import { EntityMetadata } from "sf-core/ast/entities";
import { IHTMLValueNodeExpression } from "sf-html-extension/ast";
import { NodeSection, IDOMSection } from "sf-html-extension/dom";
import { IHTMLEntity } from "./base";
import { HTMLNodeEntity } from "./node";
import { DEPENDENCIES_NS, Dependencies, Injector } from "sf-core/dependencies";

export abstract class HTMLValueNodeEntity<T extends IHTMLValueNodeExpression> extends HTMLNodeEntity<T> implements IHTMLEntity {

  private _value: any;

  mapSourceChildren() {
    return [];
  }

  get value(): any {
    return this._value;
  }

  set value(value: any) {
    this._value = value;
    if (this.section instanceof NodeSection) {
      this.section.targetNode.nodeValue = value;
    }
  }

  protected updateFromSource() {
    this.value = this.source.value;
  }

  protected willUnmount() {
    this.section.remove();
  }

  protected abstract createSection();
}
