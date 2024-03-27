import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { DocumentKind, DocumentView } from 'app/api/models';
import { DocumentsService } from 'app/api/services/documents.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { downloadResponse, empty } from 'app/shared/helper';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
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
  empty = empty;

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
    const headingActions = [];
    if (data.canEdit) {
      headingActions.push(new HeadingAction(SvgIcon.Pencil, this.i18n.general.edit, () => this.navigateToEdit(), true));
    }
    if (data.canRemove) {
      headingActions.push(new HeadingAction(SvgIcon.Trash, this.i18n.general.remove, () => this.remove(), true));
    }
    this.headingActions = headingActions;
  }

  remove() {
    this.confirmation.confirm({
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
