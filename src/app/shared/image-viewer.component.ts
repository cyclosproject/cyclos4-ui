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
 * Shows a large image, plus small thumbnails of additional images.
 * Clicking either image will show the image fullscreen
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
  @Input() profile: boolean;

  images: LightboxImage[];

  ngOnInit() {
    this.images = [];
    if (this.image) {
      this.images.push(new LightboxImage(this.image));
    }
    for (const image of this.additionalImages) {
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

  get portrait(): boolean {
    if (this.image == null) {
      return false;
    }
    return this.image.width < this.image.height;
  }
}
