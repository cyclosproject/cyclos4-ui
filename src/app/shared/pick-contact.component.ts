import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { ContactResult, User } from 'app/api/models';
import { ContactsService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseComponent } from 'app/shared/base.component';
import { PageData } from 'app/shared/page-data';
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

  private pageSize = 6;

  @Input() exclude: string[];
  @Output() select = new EventEmitter<User>();

  results$ = new BehaviorSubject<PagedResults<ContactResult>>(null);
  rendering$ = new BehaviorSubject(false);

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
  update(pageData?: PageData) {
    const data: any = pageData || {};
    this.rendering = true;
    this.results = null;
    this.addSub(this.contactsService.searchContactList$Response({
      user: ApiHelper.SELF,
      fields: ['contact'],
      pageSize: data.pageSize || this.pageSize,
      page: data.page
    }).subscribe(response => this.results = PagedResults.from(response)));
  }

  emit(row: ContactResult) {
    if (!this.isExcluded(row)) {
      this.select.emit(row.contact);
      this.modalRef.hide();
    }
  }

  get onClick() {
    return (row: ContactResult) => this.emit(row);
  }

  isExcluded(row: ContactResult) {
    return (this.exclude || []).includes(row.id);
  }

  get results(): PagedResults<ContactResult> {
    return this.results$.value;
  }
  set results(results: PagedResults<ContactResult>) {
    this.results$.next(results);
  }

  get rendering(): boolean {
    return this.rendering$.value;
  }
  set rendering(rendering: boolean) {
    this.rendering$.next(rendering);
  }

}
