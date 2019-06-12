import {
  ChangeDetectorRef, Component, ElementRef, EventEmitter, Host, Injector,
  Input, OnInit, Optional, Output, SkipSelf, ViewChild
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CustomField, Image, TempImageTargetEnum } from 'app/api/models';
import { ImagesService } from 'app/api/services';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { AvatarSize } from 'app/shared/avatar.component';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { empty, getValueAsArray, preprocessValueWithSeparator } from 'app/shared/helper';
import { LayoutService } from 'app/shared/layout.service';
import { ManageImagesComponent } from 'app/shared/manage-images.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { take } from 'rxjs/operators';

/**
 * Renders a widget for a field that allows uploading images
 */
@Component({
  selector: 'images-field',
  templateUrl: 'images-field.component.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: ImagesFieldComponent, multi: true }
  ]
})
export class ImagesFieldComponent extends BaseFormFieldComponent<string | string[]> implements OnInit {

  /**
   * The maximum of files that can be uploaded
   */
  @Input() maxFiles = 1;

  /**
   * When a separator is set, the value will be a single string, using the given separator.
   * Otherwise, the value will be a string array.
   */
  @Input() separator: string = null;

  /**
   * Provides information about the initial images.
   * Uploaded images are tracked internally.
   */
  @Input() initialImages: Image[] | Image;

  /**
   * The target of uploaded temporary images
   */
  @Input() target: TempImageTargetEnum;

  /**
   * The user for uploaded temporary images
   */
  @Input() user = '';

  /**
   * The custom field for uploaded temporary images
   */
  @Input() customField: CustomField;

  /**
   * Size for image avatars
   */
  @Input() avatarSize: AvatarSize = 'small';

  images: Image[];
  private uploadedImages: Image[];

  @Output() upload = new EventEmitter<Image[]>();

  @ViewChild('focusHolder') focusHolder: ElementRef;

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    public layout: LayoutService,
    private errorHandler: ErrorHandlerService,
    private imagesService: ImagesService,
    private changeDetector: ChangeDetectorRef,
    private modal: BsModalService) {
    super(injector, controlContainer);
  }

  preprocessValue(value: any): string | string[] {
    return preprocessValueWithSeparator(value, this.separator);
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.initialImages == null) {
      this.images = [];
    } else if (this.initialImages instanceof Array) {
      this.images = this.initialImages;
    } else {
      this.images = [this.initialImages];
    }
    this.uploadedImages = [];
  }

  /**
   * Returns all selected image ids
   */
  get imageIds(): string[] {
    return getValueAsArray(this.value, this.separator);
  }

  protected getDisabledValue(): string {
    return this.imageIds.map(id => {
      const file = this.images.find(f => f.id === id);
      return file == null ? null : file.name;
    }).filter(n => n != null).join(', ');
  }

  onImagesUploaded(images: Image[]) {
    if (this.maxFiles === 1) {
      this.removeAllImages();
    }
    const ids = this.imageIds;
    images.forEach(i => ids.push(i.id));
    this.value = ids;
    this.uploadedImages = [...images, ...this.uploadedImages];
    this.images = [...this.images, ...images];
    // Manually mark the control as touched, as there's no native inputs
    this.formControl.markAsTouched();
    this.upload.emit(images);
  }

  manageImages() {
    const ref = this.modal.show(ManageImagesComponent, {
      class: 'modal-form',
      initialState: {
        images: this.images
      }
    });
    const component = ref.content as ManageImagesComponent;
    this.addSub(component.result.pipe(take(1)).subscribe(result => {
      let value = this.imageIds;
      if (!empty(result.order)) {
        // The order has changed
        value = result.order;
      }
      if (!empty(result.removedImages)) {
        // Remove each temp image in the list
        this.uploadedImages
          .filter(i => result.removedImages.includes(i.id))
          .forEach(i => this.addSub(this.imagesService.deleteImage({ idOrKey: i.id }).subscribe()));

        // Update the arrays
        this.images = this.images.filter(i => !result.removedImages.includes(i.id));
        this.uploadedImages = this.uploadedImages.filter(i => !result.removedImages.includes(i.id));
        value = value.filter(id => !result.removedImages.includes(id));
      }
      this.images = value.map(id => this.images.find(i => i.id === id));
      this.value = value;
      ref.hide();

      // Manually mark the control as touched, as there's no native inputs
      this.notifyTouched();
    }));
  }

  removeAllImages() {
    // Remove all uploaded temporary files
    this.uploadedImages.forEach(i => {
      this.errorHandler.requestWithCustomErrorHandler(() => {
        this.addSub(this.imagesService.deleteImage({ idOrKey: i.id }).subscribe());
      });
    });
    this.images = [];
    this.value = [];
    // Manually mark the control as touched, as there's no native inputs
    this.notifyTouched();
  }

  notifyTouched() {
    super.notifyTouched();
    this.changeDetector.detectChanges();
  }

  getFocusableControl() {
    return this.focusHolder.nativeElement;
  }

}
