import { Injector } from '@angular/core';
import { User } from 'app/api/models';

/**
 * Options used when retrieving content
 */
export interface ContentGetterOptions {

  /** The logged user. Null when guest */
  user?: User;

  /** The Angular injector, which can be used to retrieve services */
  injector: Injector;

}
