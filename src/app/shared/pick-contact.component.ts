import { ChangeDetectionStrategy, Component, EventEmitter, Injector, OnInit, Output, ElementRef } from '@angular/core';
import { User, Contact } from 'app/api/models';
import { ContactsService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseComponent } from 'app/shared/base.component';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { focus } from 'app/shared/helper';

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

  contacts$ = new BehaviorSubject<User[]>(null);

  ready$ = this.contacts$.asObservable().pipe(map(c => c !== null));

  constructor(
    injector: Injector,
    private contactsService: ContactsService,
    private element: ElementRef,
    public modalRef: BsModalRef
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.addSub(this.contactsService.searchContactList({
      user: ApiHelper.SELF,
      fields: ['contact']
    }).subscribe(c => {
      this.contacts$.next(c || []);
    }));
    this.addShortcut(['ArrowUp', 'ArrowDown', 'Enter', 'Escape'], event => {
      if (event.key === 'Escape') {
        this.close();
        return;
      }

      const element = this.element.nativeElement as HTMLElement;
      const active = document.activeElement as HTMLElement;
      let index = -1;
      active.classList.forEach(c => {
        const match = c.match(/contact\-link\-(\d+)/);
        if (match) {
          index = Number.parseInt(match[1], 10);
        }
      });

      const contacts = this.contacts$.value;
      switch (event.key) {
        case 'ArrowUp':
          index--;
          break;
        case 'ArrowDown':
          index++;
          break;
        case 'Enter':
          if (index >= 0) {
            const contact = contacts[index] as Contact;
            this.emit(contact.contact);
          }
          return;
      }

      index = Math.min(Math.max(0, index), contacts.length - 1);
      const toFocus = element.getElementsByClassName(`contact-link-${index}`);
      if (toFocus.length > 0) {
        focus(toFocus.item(0));
      }
    });
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
