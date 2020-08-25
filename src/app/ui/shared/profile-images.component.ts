import { ChangeDetectionStrategy, Component, Injector, Input, OnInit, ViewChild } from '@angular/core';
import { Image } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { galleryImage } from 'app/shared/helper';
import { NgxGalleryAnimation, NgxGalleryComponent, NgxGalleryImage, NgxGalleryImageSize, NgxGalleryOptions } from 'ngx-gallery-9';

const ProfileGalleryOptions: NgxGalleryOptions = {
  imageSize: NgxGalleryImageSize.Contain,
  imageAnimation: NgxGalleryAnimation.Slide,
  thumbnailsMoveSize: 4,
  previewKeyboardNavigation: true,
  previewCloseOnClick: true,
  previewCloseOnEsc: true,
  thumbnailsAutoHide: true,
};

const MultiProfileGalleryOptions: NgxGalleryOptions[] = [ProfileGalleryOptions];

// When a single image is used, a plain `<img>` tag is shown. The gallery is hidden, and used to show the preview (full image)
const SingleProfileGalleryOptions: NgxGalleryOptions[] = [{
  width: '0',
  height: '0',
  image: false,
  thumbnails: false,
  previewArrows: false,
  previewKeyboardNavigation: true,
  previewCloseOnClick: true,
  previewCloseOnEsc: true,
}];

/**
 * Shows the user / advertisement image(s) in the view page
 */
@Component({
  selector: 'profile-images',
  templateUrl: 'profile-images.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileImagesComponent extends BaseComponent implements OnInit {
  constructor(injector: Injector) {
    super(injector);
  }

  @Input() icon: string;
  @Input() image: Image;
  @Input() additionalImages: Image[];

  galleryImages: NgxGalleryImage[];
  galleryOptions: NgxGalleryOptions[];

  @ViewChild(NgxGalleryComponent) gallery: NgxGalleryComponent;

  ngOnInit() {
    super.ngOnInit();

    if (this.image) {
      const images: Image[] = [this.image, ...(this.additionalImages || [])];
      this.galleryImages = images.map(galleryImage);
      if (images.length === 1) {
        this.element.classList.add('single-image');
        this.galleryOptions = SingleProfileGalleryOptions;
      } else {
        this.galleryOptions = MultiProfileGalleryOptions;
      }
    } else {
      this.galleryImages = [];
    }
  }

  showLightbox() {
    this.gallery.openPreview(0);
  }

}
