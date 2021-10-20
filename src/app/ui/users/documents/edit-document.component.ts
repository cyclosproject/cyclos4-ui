import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { DocumentDataForEdit, DocumentDataForNew, DocumentEdit, DocumentManage } from 'app/api/models';
import { DocumentsService } from 'app/api/services/documents.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { downloadResponse, validateBeforeSubmit } from 'app/shared/helper';
import { cloneDeep } from 'lodash-es';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Edit a document and its file as admin or broker
 */
@Component({
  selector: 'edit-document',
  templateUrl: 'edit-document.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditDocumentComponent
  extends BasePageComponent<DocumentDataForEdit | DocumentDataForNew>
  implements OnInit {

  id: string;
  form: FormGroup;
  fileControl: FormControl;
  create: boolean;
  user: string;
  fileName$ = new BehaviorSubject<string>(null);

  constructor(
    injector: Injector,
    private documentsService: DocumentsService) {
    super(injector);
  }

  isOwner(): boolean {
    return this.authHelper.isSelf(this.data.user);
  }

  ngOnInit() {
    super.ngOnInit();
    const route = this.route.snapshot;
    this.user = route.params.user;
    this.id = route.params.id;
    this.create = this.id == null;

    const request: Observable<DocumentDataForEdit | DocumentDataForNew> = this.create ?
      this.documentsService.getUserDocumentDataForNew({ user: this.user }) : this.documentsService.getDocumentDataForEdit({ id: this.id });
    this.addSub(request.subscribe(data => this.data = data));
  }

  download() {
    this.addSub(this.documentsService.downloadDocumentFile$Response({ id: this.id }).subscribe(downloadResponse));
  }

  onDataInitialized(data: DocumentDataForEdit | DocumentDataForNew) {
    super.onDataInitialized(data);
    const doc = data.document as DocumentManage;
    const docEdit = data.document as DocumentEdit;
    if (!this.create) {
      this.fileName$.next((data as DocumentDataForEdit).file?.name);
    }
    this.fileControl = this.formBuilder.control(null, this.create ? Validators.required : null);
    this.form = this.formBuilder.group({
      name: [doc.name, Validators.required],
      description: doc.description,
      enabled: doc.enabled,
      userVisible: doc.userVisible,
      brokerVisible: doc.brokerVisible,
      brokerManageable: doc.brokerManageable,
      version: docEdit.version
    });
  }

  asEdit(): DocumentDataForEdit {
    return this.data as DocumentDataForEdit;
  }

  asNew(): DocumentDataForNew {
    return this.data as DocumentDataForNew;
  }

  save() {
    validateBeforeSubmit(this.form);
    const file = this.fileControl.value;
    if (this.create || file) {
      validateBeforeSubmit(this.fileControl);
    }
    if (!this.form.valid || !this.fileControl.valid) {
      return;
    }

    const value = cloneDeep(this.form.value);
    if (!value.brokerVisible) {
      value.brokerManageable = false;
    }

    this.addSub(this.create ?
      this.documentsService.createUserDocumentWithUpload({ user: this.user, body: { document: value, file } })
        .subscribe(docId => this.notifySavedAndReload(docId)) :
      this.fileControl.value ?
        this.documentsService.updateDocumentWithUpload({ id: this.id, body: { document: value, file } })
          .subscribe(() => this.notifySavedAndReload(this.id)) :
        this.documentsService.updateDocument({ id: this.id, body: value }).subscribe(() => this.notifySavedAndReload(this.id))
    );
  }

  notifySavedAndReload(docId: string) {
    this.notification.snackBar(this.i18n.document.savedSuccessfully);
    this.router.navigate(['/users', 'documents', 'edit', docId]);
  }

  formControl(internalName: string): AbstractControl {
    return this.form.get(internalName);
  }

  resolveMenu() {
    return this.menu.searchUsersMenu();
  }
}
