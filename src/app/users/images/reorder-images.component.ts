import { Component, ChangeDetectionStrategy, Injector, Inject } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from 'app/shared/base.component';
import { ImagesService } from 'app/api/services';
import { ImagesListData, Image } from 'app/api/models';
import { ApiHelper } from 'app/shared/api-helper';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
/**
 * Allows users to reorder profile images
 */
@Component({
  selector: 'reorder-images',
  templateUrl: 'reorder-images.component.html',
  styleUrls: ['reorder-images.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReorderImagesComponent extends BaseComponent {

  data: ImagesListData;
  images = new BehaviorSubject<Image[]>([]);

  constructor(
    injector: Injector,
    public dialogRef: MatDialogRef<ReorderImagesComponent>,
    @Inject(MAT_DIALOG_DATA) images: Image[],
    private imagesService: ImagesService) {
    super(injector);
    this.images.next(images);
  }

  save() {
    const images = this.images.value;
    const ids = images.map(image => image.id);
    this.imagesService.reorderProfileImages({
      user: ApiHelper.SELF,
      ids: ids
    }).subscribe(() => {
      this.dialogRef.close(true);
    });
  }

  onReorder(images: Image[]) {
    this.images.next(images);
  }
}
