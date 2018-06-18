import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from 'app/shared/base.component';
import { ImagesService } from 'app/api/services';
import { ImagesListData, Image } from 'app/api/models';
import { ApiHelper } from 'app/shared/api-helper';
import { Action } from 'app/shared/action';

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

  constructor(
    injector: Injector,
    private imagesService: ImagesService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.imagesService.getUserImagesListData({ user: ApiHelper.SELF })
      .subscribe(data => {
        this.data = data;
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
