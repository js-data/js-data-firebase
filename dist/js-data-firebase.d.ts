
import {Adapter} from 'js-data-adapter'

interface IDict {
  [key: string]: any;
}

interface IBaseAdapter extends IDict {
  debug?: boolean,
  raw?: boolean
}
interface IBaseFirebaseAdapter extends IBaseAdapter {
  basePath?: string
  baseRef?: Firebase
}
export class FirebaseAdapter extends Adapter implements IBaseFirebaseAdapter {
  static extend(instanceProps?: IDict, classProps?: IDict): typeof FirebaseAdapter
  constructor(opts?: IBaseFirebaseAdapter)
}
export interface version {
  full: string
  minor: string
  major: string
  patch: string
  alpha: string | boolean
  beta: string | boolean
}