import { Injectable } from '@angular/core';
import { Operation } from 'app/api/models';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { SvgIcon } from 'app/core/svg-icon';

/**
 * Helper for registering known operations and running them
 */
@Injectable({
  providedIn: 'root',
})
export class OperationHelperService {

  private registry = new Map<string, Operation>();

  constructor(dataForFrontendHolder: DataForFrontendHolder) {
    dataForFrontendHolder.subscribe(dataForFrontend => {
      // Store all custom operations in the registry
      const operations = dataForFrontend?.dataForUi?.auth?.permissions?.operations;
      (operations?.system || []).forEach(o => this.register(o.operation));
      (operations?.user || []).forEach(o => this.register(o.operation));
    });
  }

  /**
   * Registers a known custom operation. Ingores null / undefined.
   */
  register(operation: Operation) {
    if (operation) {
      this.registry.set(operation.id, operation);
      if (operation.internalName) {
        this.registry.set(operation.internalName, operation);
      }
    }
  }

  /**
   * Returns an operation by internal name or id
   */
  get(key: string): Operation {
    return this.registry.get(key);
  }

  /**
   * Returns the icon name that should be used for the given operation
   */
  icon(operation: Operation): SvgIcon | string {
    return operation.svgIcon || SvgIcon.FilePlay;
  }
}
