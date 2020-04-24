import { ChangeDetectionStrategy, Component, EventEmitter, Injector, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Image, ImageKind, ImagesListData, RoleEnum, SystemImagesListData, UserImageKind } from 'app/api/models';
import { ImagesService } from 'app/api/services';
import { BaseComponent } from 'app/shared/base.component';
import { empty } from 'app/shared/helper';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';

/**
 * A dialog used by `html-field` to insert an image. Can be:
 *
 * - An external URL
 * - Picking an existing custom image
 * - Uploading a new custom image
 */
@Component({
  selector: 'insert-image-dialog',
  templateUrl: 'insert-image-dialog.component.html',
  styleUrls: ['insert-image-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsertImageDialogComponent
  extends BaseComponent implements OnInit {

  @Output() select = new EventEmitter<string>();

  allowUrl = false;
  urlOnly = false;
  urlControl = new FormControl();

  ready$ = new BehaviorSubject(false);
  images$ = new BehaviorSubject<Image[]>(null);

  categoryControl = new FormControl();
  systemCustom$ = new BehaviorSubject<SystemImagesListData>(null);
  userCustom$ = new BehaviorSubject<ImagesListData>(null);
  canUpload$ = new BehaviorSubject(false);
  uploadKind: ImageKind;
  uploadOwner$ = new BehaviorSubject<string>(null);

  constructor(
    injector: Injector,
    private imagesService: ImagesService,
    public modalRef: BsModalRef,
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const auth = this.dataForUiHolder.auth;
    if (auth.role === RoleEnum.ADMINISTRATOR) {
      this.allowUrl = true;
      this.uploadKind = ImageKind.SYSTEM_CUSTOM;
      this.addSub(this.imagesService.getSystemCustomImagesListData().subscribe(data => {
        this.systemCustom$.next(data);
        this.urlOnly = empty(data.categories) || !data.categories.find(c => c.canEdit || !empty(c.images));
        this.addSub(this.categoryControl.valueChanges.subscribe(catId => {
          const category = data.categories.find(c => c.category.id === catId);
          this.canUpload$.next(category != null && category.canCreate);
          this.uploadOwner$.next(catId);
        }));
        if (!empty(data.categories)) {
          const category = data.categories[0];
          this.categoryControl.setValue(category.category.id);
          this.canUpload$.next(category.canCreate);
        }
        this.ready$.next(true);
      }));
      this.addSub(this.categoryControl.valueChanges.subscribe(cat => {
        const category = ((this.systemCustom$.value || {}).categories || []).find(c => c.category.id === cat) || {};
        this.images$.next(category.images || []);
      }));
    } else {
      this.uploadKind = ImageKind.USER_CUSTOM;
      this.uploadOwner$.next(this.ApiHelper.SELF);
      this.addSub(this.imagesService.getUserImagesListData({
        user: this.ApiHelper.SELF,
        kind: UserImageKind.CUSTOM,
      }).subscribe(data => {
        this.userCustom$.next(data);
        this.canUpload$.next(data.canCreate);
        this.images$.next(data.images);
        this.ready$.next(true);
      }));
    }
  }

  selectUrl(url: string) {
    if (!empty(url)) {
      if (!url.includes('://')) {
        url = `http://${url}`;
      }
      this.select.emit(url);
      this.modalRef.hide();
    }
  }
}
