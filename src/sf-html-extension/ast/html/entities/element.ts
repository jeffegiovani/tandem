import { IHTMLEntity } from "./base";
import { MetadataKeys } from "sf-front-end/constants";
import { CSSRuleExpression } from "sf-html-extension/ast";
import { CSSStyleExpression } from "sf-html-extension/ast";
import { HTMLNodeEntity } from "./node";
import { AttributeChangeAction } from "sf-core/actions";
import { diffArray, patchArray } from "sf-core/utils/array";
import { parseCSS, parseCSSStyle } from "sf-html-extension/ast";
import { IDOMSection, NodeSection } from "sf-html-extension/dom";
import { HTMLElementExpression, HTMLAttributeExpression } from "sf-html-extension/ast";
import { EntityFactoryDependency, ElementAttributeValueEntity } from "sf-core/dependencies";

export class HTMLElementEntity extends HTMLNodeEntity<HTMLElementExpression> implements IHTMLEntity {

  private _attributes: Attributes;

  patch(entity: HTMLElementEntity) {
    this.patchSelf(entity);
    super.patch(entity);
  }

  protected patchSelf(entity: HTMLElementEntity) {
    const changes = diffArray(this.attributes, entity.attributes, (a, b) => a.name === b.name);

    for (const add of changes.add) {
      this.setAttribute(add.value.name, add.value.value);
    }

    for (const [oldAttribute, newAttribute] of changes.update) {
      if (oldAttribute.value !== newAttribute.value) {
        this.setAttribute(newAttribute.name, newAttribute.value);
      }
    }

    for (const remove of changes.remove) {
      this.removeAttribute(remove.name);
    }
  }

  async load() {
    await this.loadSelf();
    return super.load();
  }

  protected async loadSelf() {
    // TODO - attributes might need to be transformed here
    if (this.source.attributes) {
      for (const attribute of this.source.attributes) {
        let value: any = attribute.value;

        // is an expression
        if (value.position) {
          const valueEntity = ElementAttributeValueEntity.createEntityFromSource(value, this, this._dependencies);
          await valueEntity.load();
          value = valueEntity.value;
        }

        this.setAttribute(attribute.name, value);
      }
    }
  }

  getInitialMetadata() {
    return Object.assign(super.getInitialMetadata(), {
      [MetadataKeys.LAYER_DEPENDENCY_NAME]: "element"
    });
  }

  get attributes(): Attributes {
    return this._attributes || (this._attributes = new Attributes());
  }

  get cssRuleExpressions(): Array<CSSRuleExpression> {
    // return this.document.entity.findOrRegister(this._dependencies).rules.filter((rule) => {
    //   return rule.test(this);
    // });

    return [];
  }

  createSection(): IDOMSection {
    return new NodeSection(document.createElement(this.source.type));
  }

  static mapSourceChildren(source: HTMLElementExpression) {
    return source.children;
  }

  removeAttribute(name: string) {
    this.attributes.remove(name);
    (<Element>this.section.targetNode).removeAttribute(name);
  }

  getAttribute(name: string) {
    return this.attributes.get(name);
  }

  hasAttribute(name: string) {
    return this.attributes.has(name);
  }

  setAttribute(name: string, value: string) {
    if (this.section instanceof NodeSection) {
      (<Element>this.section.targetNode).setAttribute(name, value);
    }
    this.attributes.set(name, value);
    this.notify(new AttributeChangeAction(name, value));
  }

  cloneLeaf() {
    const clone = new HTMLElementEntity(this.source);
    this.cloneAttributesToElement(clone);
    return clone;
  }

  protected cloneAttributesToElement(element: HTMLElementEntity) {
    for (const attribute of this.attributes) {
      element.setAttribute(attribute.name, attribute.value);
    }
  }

  willUnmount() {
    this.section.remove();
  }
}


export class Attribute {
  constructor(public name: string, public value: any) { }
}

export class Attributes extends Array<Attribute> {

  has(name: string) {
    for (const attribute of this) {
      if (attribute.name === name) return true;
    }
    return false;
  }

  set(name: string, value: any) {
    let found = false;
    for (const attribute of this) {
      if (attribute.name === name) {
        attribute.value = value;
        found = true;
      };
    }
    if (!found) {
      this.push(new Attribute(name, value));
    }
  }

  get(name: string) {
    for (const attribute of this) {
      if (attribute.name === name) return attribute.value;
    }
  }

  remove(name: string) {
    for (let i = this.length; i--; ) {
      const attribute = this[i];
      if (attribute.name === name) {
        this.splice(i, 1);
        return;
      }
    }
  }
}
