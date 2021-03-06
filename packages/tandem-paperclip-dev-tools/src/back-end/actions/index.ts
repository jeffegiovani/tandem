import { Action } from "redux";
import { FileCacheItem } from "../state";
import { Request, Response } from "express";
import { publicActionFactory } from "aerial-common2";

export const ALERT = "ALERT";
export const EXTENSION_ACTIVATED = "EXTENSION_ACTIVATED";
export const HTTP_REQUEST = "HTTP_REQUEST";
export const VISUAL_DEV_CONFIG_LOADED = "VISUAL_DEV_CONFIG_LOADED";
export const CHILD_DEV_SERVER_STARTED = "CHILD_DEV_SERVER_STARTED";
export const MUTATE_SOURCE_CONTENT = "MUTATE_SOURCE_CONTENT";
export const FILE_CONTENT_CHANGED = "FILE_CONTENT_CHANGED";
export const START_DEV_SERVER_EXECUTED = "START_DEV_SERVER_EXECUTED";
export const STOP_DEV_SERVER_EXECUTED = "STOP_DEV_SERVER_EXECUTED";
export const FILE_CHANGED = "FILE_CHANGED";
export const WATCH_URIS_REQUESTED = "WATCH_URIS_REQUESTED";
export const WATCHING_FILES = "WATCHING_FILES";

export type HTTPRequest = {
  request: Request;
  response: Response;
} & Action;

export type Mutation =  {
  $type: string;
  source: {
    uri: string
  }
};

export type FileContentChanged =  {
  filePath: string;
  content: Buffer;
  mtime: Date;
} & Action;

export type FileAction = {
  filePath: string
} & Action;

export type MutateSourceContentRequest = {
  mutations: Mutation[];
} & FileAction;

export type WatchUrisRequested = {
  uris: string[]
} & Action;

export type WatchingFiles = {
  initialFileCache: FileCacheItem[]
} & Action;

export enum AlertLevel {
  NOTICE,
  ERROR,
  WARNING
};

export type Alert = {
  level: AlertLevel;
  text: string;
} & Action;

export type ChildDevServerStarted = {
  port: number
} & Action;

export const watchUrisRequested = (uris: string[]): WatchUrisRequested => ({
  uris,
  type: WATCH_URIS_REQUESTED
})

export const fileChanged = publicActionFactory((filePath: string) => ({
  type: FILE_CHANGED,
  filePath
}));

export const extensionActivated = () => ({
  type: EXTENSION_ACTIVATED
});

export const fileContentChanged = (filePath: string, content: Buffer, mtime: Date): FileContentChanged  => ({
  type: FILE_CONTENT_CHANGED,
  content,
  filePath,
  mtime
});

export const childDevServerStarted = (port: number): ChildDevServerStarted => ({
  port,
  type: CHILD_DEV_SERVER_STARTED
});

export const httpRequest = (request: Request, response: Response): HTTPRequest => ({
  type: HTTP_REQUEST,
  request,
  response,
});

export const watchingFiles = (initialFileCache: FileCacheItem[]): WatchingFiles => ({
  type: WATCHING_FILES,
  initialFileCache
})
export const startDevServerExecuted = () => ({ 
  type: START_DEV_SERVER_EXECUTED
});

