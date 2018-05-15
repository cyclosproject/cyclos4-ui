import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Country } from 'app/api/models/country';
import { AddressesService } from 'app/api/services';
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
