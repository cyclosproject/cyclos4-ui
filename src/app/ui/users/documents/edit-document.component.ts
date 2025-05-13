import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { DocumentDataForEdit, DocumentDataForNew, DocumentEdit, DocumentKind, DocumentManage } from 'app/api/models';
import { DocumentsService } from 'app/api/services/documents.service';
import { downloadResponse, empty, validateBeforeSubmit } from 'app/shared/helper';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { cloneDeep } from 'lodash-es';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Edit a document and its file as admin or broker
 */
@Component({
  selector: 'edit-document',
  templateUrl: 'edit-document.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditDocumentComponent
  extends BasePageComponent<DocumentDataForEdit | DocumentDataForNew>
  implements OnInit
{
  DocumentKind = DocumentKind;
  id: string;
  form: FormGroup;
  fileControl: FormControl;
  create: boolean;
  user: string;
  fileName$ = new BehaviorSubject<string>(null);
  downloadUrl$ = new BehaviorSubject<string>(null);

  constructor(injector: Injector, private documentsService: DocumentsService) {
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

    const request: Observable<DocumentDataForEdit | DocumentDataForNew> = this.create
      ? this.documentsService.getUserDocumentDataForNew({ user: this.user })
      : this.documentsService.getDocumentDataForEdit({ id: this.id });
    this.addSub(request.subscribe(data => (this.data = data)));
  }

  download() {
    this.addSub(
      this.documentsService
        .downloadDocumentFile$Response({ id: this.id })
        .subscribe(r => downloadResponse(r, this.notification, this.i18n))
    );
  }

  onDataInitialized(data: DocumentDataForEdit | DocumentDataForNew) {
    super.onDataInitialized(data);
    const doc = data.document as DocumentManage;
    const docEdit = data.document as DocumentEdit;
    if (!this.create) {
      this.fileName$.next((data as DocumentDataForEdit).file?.name);
      this.downloadUrl = this.urlFromTemplate(
        doc.internalName || this.id,
        (data as DocumentDataForEdit).downloadUrlTemplate
      );
    }
    this.fileControl = this.formBuilder.control(null, this.create ? Validators.required : null);
    this.form = this.formBuilder.group({
      name: [doc.name, Validators.required],
      internalName: doc.internalName,
      description: doc.description,
      category: doc.category,
      enabled: doc.enabled,
      publiclyAccessible: doc.publiclyAccessible,
      userVisible: doc.userVisible,
      brokerVisible: doc.brokerVisible,
      brokerManageable: doc.brokerManageable,
      version: docEdit.version
    });

    const updateUrl = (value, publiclyAccessible) => {
      this.downloadUrl = publiclyAccessible
        ? this.urlFromTemplate(value || this.id, (data as DocumentDataForEdit).downloadUrlTemplate)
        : null;
    };

    this.form.controls.internalName.valueChanges.subscribe(val =>
      updateUrl(val, this.form.controls.publiclyAccessible.value)
    );

    this.form.controls.publiclyAccessible.valueChanges.subscribe(val =>
      updateUrl(this.form.controls.internalName.value, val)
    );
  }

  asEdit(): DocumentDataForEdit {
    return this.data as DocumentDataForEdit;
  }

  asNew(): DocumentDataForNew {
    return this.data as DocumentDataForNew;
  }

  save() {
    const file = this.fileControl.value as File;
    if (!validateBeforeSubmit(this.form) || ((this.create || file) && !validateBeforeSubmit(this.fileControl))) {
      return;
    }

    const value = cloneDeep(this.form.value);
    if (!value.brokerVisible) {
      value.brokerManageable = false;
    }
    const onFinish = { next: (id?: string | void) => this.notifySavedAndReload(id || this.id) };
    this.addSub(
      this.create
        ? this.documentsService
            .createUserDocumentWithUpload({ user: this.user, body: { document: value, file, fileName: file.name } })
            .subscribe(onFinish)
        : file
        ? this.documentsService
            .updateDocumentWithUpload({ id: this.id, body: { document: value, file, fileName: file.name } })
            .subscribe(onFinish)
        : this.documentsService.updateDocument({ id: this.id, body: value }).subscribe(onFinish)
    );
  }

  notifySavedAndReload(docId: string) {
    this.notification.snackBar(this.i18n.document.savedSuccessfully);
    this.router.navigate(['/users', 'documents', 'edit', docId]);
  }

  formControl(internalName: string): AbstractControl {
    return this.form.get(internalName);
  }

  get downloadUrl(): string {
    return this.downloadUrl$.value;
  }

  set downloadUrl(downloadUrl: string) {
    this.downloadUrl$.next(downloadUrl);
  }

  private urlFromTemplate(key: string, template: string): string {
    if (empty(template) || empty(key)) {
      return null;
    }
    return template.replace('{key}', key);
  }

  resolveMenu() {
    return this.menu.searchUsersMenu();
  }
}
