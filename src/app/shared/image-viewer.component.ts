import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { Image } from 'app/api/models';
import { Lightbox } from 'angular2-lightbox';

const MAX_THUMB_WIDTH = 160;
const MAX_THUMB_HEIGHT = 100;

export class LightboxImage {
  src: string;
  thumb: string;
  caption: string;

  constructor(image: Image) {
    this.src = image.url;
    this.thumb = `${image.url}?width=${MAX_THUMB_WIDTH}&height=${MAX_THUMB_HEIGHT}`;
    this.caption = image.name;
  }
}

/**
 * May either show a large image (when image is set), such as in the user profile,
 * or a set of small images (when image is null, but has additionalImages).
 * Clicking the image will show the lightbox with all images.
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'image-viewer',
  templateUrl: 'image-viewer.component.html',
  styleUrls: ['image-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageViewerComponent implements OnInit {
  constructor(private lightbox: Lightbox) {
  }

  @Input() image: Image;
  @Input() additionalImages: Image[];

  images: LightboxImage[];

  ngOnInit() {
    this.images = [];
    if (this.image) {
      this.images.push(new LightboxImage(this.image));
    }
    for (const image of this.additionalImages || []) {
      this.images.push(new LightboxImage(image));
    }
  }

  /**
   * Shows the lightbox
   * @param index The image index to show
   */
  onClick(event: MouseEvent, index: number) {
    this.lightbox.open(this.images, index);
    event.preventDefault();
    event.stopPropagation();
  }
}
