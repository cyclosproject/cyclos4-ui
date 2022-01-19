import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { ContactResult, User } from 'app/api/models';
import { ContactsService } from 'app/api/services/contacts.service';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseComponent } from 'app/shared/base.component';
import { PagedResults } from 'app/shared/paged-results';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';

/**
 * A component to be shown in a dialog, showing the user contact list
 */
@Component({
  selector: 'pick-contact',
  templateUrl: 'pick-contact.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PickContactComponent extends BaseComponent implements OnInit {

  currentPage = 0;

  @Input() usersToExclude: string[];
  @Output() select = new EventEmitter<User>();

  results$ = new BehaviorSubject<PagedResults<ContactResult>>(null);

  constructor(
    injector: Injector,
    private contactsService: ContactsService,
    public modalRef: BsModalRef,
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.update();
  }

  /**
   * Updates the search results
   */
  update(delta = 0) {
    this.currentPage += delta;
    this.results = null;
    this.addSub(this.contactsService.searchContactList$Response({
      user: ApiHelper.SELF,
      fields: ['contact'],
      pageSize: this.layout.ltmd ? 6 : this.layout.md ? 10 : 20,
      page: this.currentPage,
      usersToExclude: this.usersToExclude
    }).subscribe(response => this.results = PagedResults.from(response)));
  }

  emit(row: ContactResult) {
    this.select.emit(row.contact);
    this.modalRef.hide();
  }

  get onClick() {
    return (row: ContactResult) => this.emit(row);
  }

  get results(): PagedResults<ContactResult> {
    return this.results$.value;
  }
  set results(results: PagedResults<ContactResult>) {
    this.results$.next(results);
  }

}
