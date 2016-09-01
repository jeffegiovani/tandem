import { Action } from "../actions";
import { IActor } from "../actors";
import { ITyped } from "sf-core/object";
import { IBrokerBus } from "../busses";
import { IApplication } from "sf-core/application";
import { IActiveRecord } from "../active-records";
import { IEntity, IValueEntity, IEntityDocument } from "sf-core/ast";

import {
  IFactory,
  Dependency,
  IDependency,
  Dependencies,
  ClassFactoryDependency,
 } from "./base";

// TODO - add more static find methods to each Dependency here

export * from "./base";

/**
 */

export const APPLICATION_SERVICES_NS = "application/services";
export class ApplicationServiceDependency extends ClassFactoryDependency implements IFactory {

  constructor(id: string, clazz: { new(): IActor }) {
    super(`${APPLICATION_SERVICES_NS}/${id}`, clazz);
  }

  create(): IActor {
    return super.create();
  }

  static findAll(Dependencies: Dependencies): Array<ApplicationServiceDependency> {
    return Dependencies.queryAll<ApplicationServiceDependency>(`${APPLICATION_SERVICES_NS}/**`);
  }
}

/**
 */

export const APPLICATION_SINGLETON_NS = "singletons/application";
export class ApplicationSingletonDependency extends Dependency<IApplication> {

  constructor(value: IApplication) {
    super(APPLICATION_SINGLETON_NS, value);
  }

  static find(Dependencies: Dependencies): ApplicationSingletonDependency {
    return Dependencies.query<ApplicationSingletonDependency>(APPLICATION_SINGLETON_NS);
  }
}

/**
 */

export const ENTITIES_NS = "entities";

type mapSourceChildrenType = (source: any) => Array<any>;

// TODO - possibly require renderer here as well
export class EntityFactoryDependency extends ClassFactoryDependency {

  readonly mapSourceChildren: mapSourceChildrenType;

  constructor(readonly name: string, readonly clazz: { new(source: ITyped): IEntity, mapSourceChildren?: mapSourceChildrenType } ) {
    super([ENTITIES_NS, name].join("/"), clazz);
    this.mapSourceChildren = clazz.mapSourceChildren;
  }

  clone() {
    return new EntityFactoryDependency(this.name, this.clazz);
  }

  create(source: ITyped) {
    return super.create(source);
  }

  static findByName(name: string, dependencies: Dependencies) {
    return dependencies.query<EntityFactoryDependency>([ENTITIES_NS, name].join("/"));
  }

  static findBySource(source: ITyped, dependencies: Dependencies) {
    return this.findByName(source.type, dependencies);
  }

  static createEntityFromSource(source: ITyped, dependencies: Dependencies) {
    const dependency = this.findBySource(source, dependencies);

    if (!dependency) {
      throw new Error(`Unable to find entity factory for source type "${source.constructor.name}".`);
    }

    return dependency.create(source);
  }
}


// TODO - possibly require renderer here as well
export class ElementAttributeValueEntity extends ClassFactoryDependency {

  readonly mapSourceChildren: mapSourceChildrenType;

  constructor(readonly type: string, readonly clazz: { new(source: ITyped, target: IEntity): IEntity, mapSourceChildren?: mapSourceChildrenType } ) {
    super([ENTITIES_NS, type].join("/"), clazz);
    this.mapSourceChildren = clazz.mapSourceChildren;
  }

  clone() {
    return new ElementAttributeValueEntity(this.type, this.clazz);
  }

  create(source: ITyped, element: IEntity) {
    return super.create(source, element);
  }

  static findByName(name: string, dependencies: Dependencies) {
    return dependencies.query<ElementAttributeValueEntity>([ENTITIES_NS, name].join("/"));
  }

  static findBySource(source: ITyped, dependencies: Dependencies) {
    return this.findByName(source.type, dependencies);
  }

  static createEntityFromSource(source: ITyped, element: IEntity, dependencies: Dependencies): IValueEntity {
    const dependency = this.findBySource(source, dependencies);

    if (!dependency) {
      throw new Error(`Unable to find entity factory for source type "${source.constructor.name}".`);
    }

    return dependency.create(source, element);
  }
}

export const ENTITY_DOCUMENT_NS = "entityDocument";
export class EntityDocumentDependency extends Dependency<IEntityDocument> {
  constructor(document: IEntityDocument) {
    super(ENTITY_DOCUMENT_NS, document, true);
  }
}

/**
 */

export const MAIN_BUS_NS = "mainBus";
export class MainBusDependency extends Dependency<IBrokerBus> {
  constructor(value: IBrokerBus) {
    super(MAIN_BUS_NS, value);
  }
  static getInstance(Dependencies: Dependencies): IBrokerBus {
    return Dependencies.query<MainBusDependency>(MAIN_BUS_NS).value;
  }
}

/**
 */

export const DEPENDENCIES_NS = "dependencies";
export class DependenciesDependency extends Dependency<Dependencies> {
  constructor() {
    super(DEPENDENCIES_NS, null);
  }

  get dependencies(): Dependencies {
    return this.value;
  }

  set dependencies(value: Dependencies) {
    this.value = value;
  }
}

/**
 */

export const ACTIVE_RECORD_FACTORY_NS = "activeRecordFactories";
export class ActiveRecordFactoryDependency extends ClassFactoryDependency {
  constructor(id: string, value: { new(sourceData: any): IActiveRecord }) {
    super([ACTIVE_RECORD_FACTORY_NS, id].join("/"), value);
  }

  create(collectionName: string, sourceData?: any): any {
    const activeRecord: IActiveRecord = super.create();
    activeRecord.collectionName = collectionName;
    if (sourceData != null) {
      activeRecord.deserialize(sourceData);
    }
    return activeRecord;
  }

  static find(id: string, dependencies: Dependencies): ActiveRecordFactoryDependency {
    return dependencies.query<ActiveRecordFactoryDependency>([ACTIVE_RECORD_FACTORY_NS, id].join("/"));
  }
}

/**
 */

export const COMMAND_FACTORY_NS = "commands";
export class CommandFactoryDependency extends ClassFactoryDependency {
  readonly actionFilter: Function;
  constructor(actionFilter: string|Function, readonly clazz: { new(): IActor }) {
    super([COMMAND_FACTORY_NS, clazz.name].join("/"), clazz);
    if (typeof actionFilter === "string") {
      this.actionFilter = (action: Action) => action.type === actionFilter;
    } else {
      this.actionFilter = actionFilter;
    }
  }
  static findAll(dependencies: Dependencies) {
    return dependencies.query<CommandFactoryDependency>([COMMAND_FACTORY_NS, "**"].join("/"));
  }

  clone() {
    return new CommandFactoryDependency(this.actionFilter, this.clazz);
  }
}

/**
 */

export const MIME_TYPE_NS = "mimeType";
export class MimeTypeDependency extends Dependency<string> {
  constructor(fileExtension: string, mimeType: string) {
    super([MIME_TYPE_NS, fileExtension].join("/"), mimeType);
  }
  findAll(dependencies: Dependencies) {
    return dependencies.queryAll<MimeTypeDependency>([MIME_TYPE_NS, "**"].join("/"));
  }
  static lookup(filepath: string, dependencies: Dependencies): string {
    const extension = filepath.split(".").pop();
    const dep = dependencies.query<MimeTypeDependency>([MIME_TYPE_NS, extension].join("/"));
    return dep ? dep.value : undefined;
  }
}

// /**
//  */

// export const FILE_NS = "files";
// export class FileFactoryDependency extends Dependency<string> {
//   constructor(mimeType: string) {
//     super([FILE_NS, mimeType].join("/"), mimeType);
//   }
//   findAll(dependencies: Dependencies) {
//     return dependencies.queryAll<MimeTypeDependency>([MIME_TYPE_NS, "**"].join("/"));
//   }
//   static lookup(filepath: string, dependencies: Dependencies): string {
//     const extension = filepath.split(".").pop();
//     const dep = dependencies.query<MimeTypeDependency>([MIME_TYPE_NS, extension].join("/"));
//     return dep ? dep.value : undefined;
//   }
// }