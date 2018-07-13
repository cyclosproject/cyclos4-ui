import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { BaseComponent } from 'app/shared/base.component';
import { ImagesService } from 'app/api/services';
import { ImagesListData, Image, UserImageKind } from 'app/api/models';
import { ApiHelper } from 'app/shared/api-helper';
import { Action } from 'app/shared/action';
import { MatDialog } from '@angular/material';
import { ReorderImagesComponent } from 'app/users/images/reorder-images.component';
import { cloneDeep } from 'lodash';

/**
 * Manages the images of a user.
 * Currently implemented only for the logged user's images
 */
@Component({
  selector: 'manage-images',
  templateUrl: 'manage-images.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageImagesComponent extends BaseComponent {

  loaded = new BehaviorSubject(false);
  data: ImagesListData;
  createActions: Action[];
  titleActions: Action[];

  constructor(
    injector: Injector,
    private dialog: MatDialog,
    private imagesService: ImagesService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.imagesService.getUserImagesListData({ user: ApiHelper.SELF })
      .subscribe(data => {
        this.data = data;
        if ((data.images || []).length > 1) {
          this.titleActions = [
            new Action('reorder', this.messages.imageReorder(), () => {
              this.dialog.open(ReorderImagesComponent, this.layout.formDialogConfig(data.images)).afterClosed().subscribe(saved => {
                if (saved) {
                  this.notification.snackBar(this.messages.imageReorderDone());
                  this.reload();
                }
              });
            })
          ];
        }

        // Update the logged user, so the image above is correct
        const user = cloneDeep(this.login.user);
        const images = this.data.images || [];
        user.image = images.length === 0 ? null : this.data.images[0];
        this.login.user$.next(user);

        this.loaded.next(true);
      });
  }

  actions(image: Image): Action[] {
    const actions: Action[] = [];
    actions.push(new Action('delete', this.messages.remove(), () => {
      this.remove(image);
    }));
    return actions;
  }

  uploadImages(files: File | FileList) {
    const hadNoImages = (this.data.images || []).length === 0;
    const observables: Observable<any>[] = [];
    if (files instanceof File) {
      observables.push(this.imagesService.uploadUserImage({
        user: ApiHelper.SELF,
        kind: UserImageKind.PROFILE,
        image: files
      }));
    } else {
      for (let i = 0; i < files.length; i++) {
        observables.push(this.imagesService.uploadUserImage({
          user: ApiHelper.SELF,
          kind: UserImageKind.PROFILE,
          image: files.item(i)
        }));
      }
    }
    combineLatest(observables).subscribe(() => {
      this.notification.snackBar(this.messages.imageProfileUploaded());
      this.reload();
    });
  }

  private remove(image: Image) {
    this.notification.yesNo(this.messages.imageRemove(image.name))
      .subscribe(answer => {
        if (answer) {
          this.doRemove(image);
        }
      });
  }

  private doRemove(image: Image, confirmationPassword: string = null) {
    this.imagesService.deleteImage(image.id).subscribe(() => {
      this.notification.snackBar(this.messages.imageRemoved());
      this.reload();
    });
  }

  private reload() {
    this.loaded.next(false);
    this.ngOnInit();
  }
}
