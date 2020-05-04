import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { DocumentKind, EntityReference } from 'app/api/models';
import { Document } from 'app/api/models/document';
import { DocumentsService } from 'app/api/services';
import { BasePageComponent } from 'app/shared/base-page.component';
import { downloadResponse } from 'app/shared/helper';
import { Menu } from 'app/shared/menu';

/**
 * Operator groups list
 */
@Component({
  selector: 'list-documents',
  templateUrl: 'list-documents.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListDocumentsComponent
  extends BasePageComponent<Document[]>
  implements OnInit {

  constructor(
    injector: Injector,
    private documentsService: DocumentsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.addSub(this.documentsService.listUserDocuments({ user: this.ApiHelper.SELF }).subscribe(data => this.data = data));
  }

  showPrintButton(kind: DocumentKind) {
    return kind !== DocumentKind.DYNAMIC;
  }

  print(document: Document) {
    this.addSub(this.documentsService.downloadDocumentFile$Response({ id: document.id }).subscribe(downloadResponse));
  }

  path(document: EntityReference) {
    return ['/users', 'documents', document.id];
  }

  get toLink() {
    return (document: EntityReference) => this.path(document);
  }

  resolveMenu() {
    return this.authHelper.userMenu(null, Menu.MY_DOCUMENTS);
  }
}
