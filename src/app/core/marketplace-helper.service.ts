import { Injectable } from '@angular/core';
import { AdKind } from 'app/api/models';



/**
 * Helper service for marketplace functions
 */
@Injectable({
  providedIn: 'root'
})
export class MarketplaceHelperService {



  constructor(

  ) { }


  /**
   * Resolves an AdKind from the given parameter
   */
  resolveKind(param: string): AdKind {
    if (param) {
      switch (param) {
        case 'simple':
          return AdKind.SIMPLE;
        case 'webshop':
          return AdKind.WEBSHOP;
      }
    }
    return null;
  }

}
