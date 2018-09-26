import { Component, ChangeDetectionStrategy, Injector, Input, Output, EventEmitter, OnInit } from '@angular/core';

import { User } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Observable } from 'rxjs';
import { ContactsService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';
import { map } from 'rxjs/operators';

/**
 * A component to be shown in a dialog, showing the user contact list
 */
@Component({
  selector: 'pick-contact',
  templateUrl: 'pick-contact.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PickContactComponent extends BaseComponent implements OnInit {

  @Output() select = new EventEmitter<User>();

  contacts$: Observable<User[]>;

  constructor(
    injector: Injector,
    private contactsService: ContactsService,
    public modalRef: BsModalRef
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.contacts$ = this.contactsService.searchContactList({
      user: ApiHelper.SELF,
      fields: ['contact']
    }).pipe(
      map(contacts => contacts.map(c => c.contact))
    );
  }

  emit(contact: User, event: MouseEvent) {
    this.select.emit(contact);
    event.preventDefault();
    this.modalRef.hide();
  }

}
