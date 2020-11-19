import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { DocumentDataForSearch, DocumentKind, DocumentQueryFilters, DocumentResult, EntityReference } from 'app/api/models';
import { Document } from 'app/api/models/document';
import { DocumentsService } from 'app/api/services/documents.service';
import { HeadingAction } from 'app/shared/action';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { downloadResponse } from 'app/shared/helper';
import { Observable } from 'rxjs';
import { SvgIcon } from 'app/core/svg-icon';

/**
 * Search the documents of the given user as admin or broker
 */
@Component({
  selector: 'search-documents',
  templateUrl: 'search-documents.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchDocumentsComponent
  extends BaseSearchPageComponent<DocumentDataForSearch, DocumentQueryFilters, DocumentResult>
  implements OnInit {

  user: string;

  constructor(
    injector: Injector,
    private documentsService: DocumentsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user;
    this.addSub(this.documentsService.getDocumentsDataForSearch({ user: this.user }).subscribe(data => this.data = data));
  }

  onDataInitialized(data: DocumentDataForSearch) {
    super.onDataInitialized(data);
    this.headingActions = [new HeadingAction(SvgIcon.PlusCircle, this.i18n.general.add, () => {
      this.router.navigate(['/users', this.user, 'documents', 'new']);
    }, true)];
  }

  protected doSearch(value: DocumentQueryFilters): Observable<HttpResponse<DocumentResult[]>> {
    return this.documentsService.searchDocuments$Response(value);
  }

  remove(doc: DocumentResult) {
    this.notification.confirm({
      message: this.i18n.general.removeItemConfirm,
      callback: () => this.doRemove(doc),
    });
  }

  private doRemove(doc: DocumentResult) {
    this.addSub(this.documentsService.deleteDocument({ id: doc.id }).subscribe(() => {
      this.notification.snackBar(this.i18n.general.removeItemDone);
      this.update();
    }));
  }

  protected toSearchParams(params: any): DocumentQueryFilters {
    return params;
  }

  protected getFormControlNames(): string[] {
    return ['brokers', 'categories', 'enabled', 'groups', 'keywords', 'range', 'user'];
  }

  isStatic(kind: DocumentKind) {
    return kind !== DocumentKind.DYNAMIC;
  }

  download(document: Document) {
    this.addSub(this.documentsService.downloadDocumentFile$Response({ id: document.id }).subscribe(downloadResponse));
  }

  process(document: EntityReference) {
    return ['/users', 'documents', 'process-dynamic', document.id];
  }

  view(document: EntityReference) {
    return ['/users', 'documents', 'view', document.id];
  }

  isUserKind(document: DocumentResult): boolean {
    return document.kind === DocumentKind.USER;
  }

  navigateToView(document: DocumentResult) {
    this.router.navigate(this.view(document));
  }

  get toProcessLink() {
    return (document: DocumentResult) => this.process(document);
  }

  resolveMenu() {
    return this.menu.searchUsersMenu();
  }
}
