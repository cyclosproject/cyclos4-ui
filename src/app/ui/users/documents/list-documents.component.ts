import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { DocumentKind, EntityReference } from 'app/api/models';
import { Document } from 'app/api/models/document';
import { DocumentsService } from 'app/api/services/documents.service';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { downloadResponse } from 'app/shared/helper';
import { Menu } from 'app/ui/shared/menu';

/**
 * List the logged user documents
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
    this.addSub(this.documentsService.listUserDocuments({ user: ApiHelper.SELF }).subscribe(data => this.data = data));
  }

  isStatic(kind: DocumentKind) {
    return kind !== DocumentKind.DYNAMIC;
  }

  download(document: Document) {
    if (document.file) {
      this.addSub(this.documentsService.downloadDocumentFile$Response({ id: document.id }).subscribe(downloadResponse));
    } else {
      this.notification.info(this.i18n.document.errorNoFile);
    }
  }

  path(document: EntityReference) {
    return ['/users', 'documents', 'process-dynamic', document.id];
  }

  resolveMenu() {
    return this.menu.userMenu(null, Menu.MY_DOCUMENTS);
  }
}
