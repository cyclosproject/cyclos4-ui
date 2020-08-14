import { Injectable } from '@angular/core';
import { Country } from 'app/api/models/country';
import { AddressesService } from 'app/api/services';
import { SingletonResolve } from 'app/ui/singleton.resolve';
import { Observable } from 'rxjs';

/**
 * Loads the possible groups for registration
 */
@Injectable({
  providedIn: 'root',
})
export class CountriesResolve extends SingletonResolve<Country[]> {
  countries: { [code: string]: string };

  constructor(
    private addressesService: AddressesService,
  ) {
    super();
  }

  fetch(): Observable<Country[]> {
    return this.addressesService.listCountries();
  }

  protected onFetched(data: Country[]) {
    this.countries = {};
    data.forEach(c => this.countries[c.code] = c.name);
  }

  /**
   * Returns the country name for the given code
   * @param code The country code
   */
  name(code: string): string {
    const name = this.countries[code];
    return name == null ? code : name;
  }
}
