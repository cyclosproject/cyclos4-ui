import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from 'app/shared/base.component';
import { PhonesService } from 'app/api/services';
import { UserPhonesListData } from 'app/api/models';
import { ApiHelper } from 'app/shared/api-helper';

const BASIC_FIELDS = ['name', 'username', 'email'];

/**
 * Manages the phones of a user.
 * Currently implemented only for the logged user's phones
 */
@Component({
  selector: 'manage-phones',
  templateUrl: 'manage-phones.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagePhonesComponent extends BaseComponent {

  constructor(
    injector: Injector,
    private phonesService: PhonesService) {
    super(injector);
  }

  loaded = new BehaviorSubject(false);
  data = new BehaviorSubject<UserPhonesListData>(null);

  ngOnInit() {
    super.ngOnInit();
    this.phonesService.getUserPhonesListData({ user: ApiHelper.SELF })
      .subscribe(data => {
        this.data.next(data);
        this.loaded.next(true);
      });
  }
}
