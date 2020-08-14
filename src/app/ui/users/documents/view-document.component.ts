import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { DocumentKind, DocumentView, RoleEnum } from 'app/api/models';
import { DocumentsService } from 'app/api/services/documents.service';
import { HeadingAction } from 'app/shared/action';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { downloadResponse } from 'app/shared/helper';
import { Menu } from 'app/ui/shared/menu';

/**
 * View the details of a document. Only for managers
 */
@Component({
  selector: 'view-document',
  templateUrl: 'view-document.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewDocumentComponent
  extends BasePageComponent<DocumentView>
  implements OnInit {

  id: string;

  constructor(
    injector: Injector,
    private documentsService: DocumentsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.id = this.route.snapshot.params.id;
    this.addSub(this.documentsService.viewDocument({ id: this.id }).subscribe(data => this.data = data));
  }

  onDataInitialized(data: DocumentView) {
    super.onDataInitialized(data);
    if (this.dataForUiHolder.auth.role !== RoleEnum.BROKER || data.brokerManageable) {
      const headingActions = [new HeadingAction('edit', this.i18n.general.edit, () => this.navigateToEdit(), true)];
      headingActions.push(new HeadingAction('clear', this.i18n.general.remove, () => this.remove(), true));
      this.headingActions = headingActions;
    }
  }

  remove() {
    this.notification.confirm({
      message: this.i18n.general.removeItemConfirm,
      callback: () => this.doRemove(),
    });
  }

  private doRemove() {
    this.addSub(this.documentsService.deleteDocument({ id: this.id }).subscribe(() => {
      this.notification.snackBar(this.i18n.general.removeItemDone);
      this.router.navigate(['/users', this.data.user.id, 'documents', 'search']);
    }));
  }

  download() {
    this.addSub(this.documentsService.downloadDocumentFile$Response({ id: this.id }).subscribe(downloadResponse));
  }

  navigateToEdit() {
    this.router.navigate(['/users', 'documents', 'edit', this.id]);
  }

  resolveMenu(data: DocumentView) {
    if (data.kind === DocumentKind.USER && this.authHelper.isSelf(data.user)) {
      return this.menu.userMenu(null, Menu.MY_DOCUMENTS);
    } else {
      return this.menu.searchUsersMenu();
    }
  }
}
