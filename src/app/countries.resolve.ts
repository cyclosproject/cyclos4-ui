import { Injectable } from '@angular/core';
import { Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { tap } from 'rxjs/operators/tap';
import { Country } from 'app/api/models/country';
import { AddressesService } from 'app/api/services';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { SingletonResolve } from 'app/singleton.resolve';

/**
 * Loads the possible groups for registration
 */
@Injectable()
export class CountriesResolve extends SingletonResolve<Country[]> {
  constructor(
    private addressesService: AddressesService
  ) {
    super();
  }

  fetch(): Observable<Country[]> {
    return this.addressesService.listCountries();
  }
}
