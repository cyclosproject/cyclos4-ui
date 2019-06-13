import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { User } from 'app/api/models';
import { ContactsService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseComponent } from 'app/shared/base.component';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';
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

  @Input() exclude: string;

  @Output() select = new EventEmitter<User>();

  contacts$ = new BehaviorSubject<User[]>(null);

  ready$ = this.contacts$.asObservable().pipe(map(c => c !== null));

  constructor(
    injector: Injector,
    private contactsService: ContactsService,
    public modalRef: BsModalRef
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.addSub(this.contactsService.searchContactList({
      user: ApiHelper.SELF,
      fields: ['contact']
    }).subscribe(result => {
      const contacts = (result || []).filter(c => this.exclude ? c.contact.id !== this.exclude : true);
      this.contacts$.next(contacts);
    }));
  }

  emit(contact: User, event?: MouseEvent) {
    this.select.emit(contact);
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.close();
  }

  close() {
    this.modalRef.hide();
  }

}
