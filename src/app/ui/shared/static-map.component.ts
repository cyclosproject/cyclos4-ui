import {
  ChangeDetectionStrategy, Component, ElementRef,
  EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild,
} from '@angular/core';
import { Address } from 'app/api/models';
import { AddressHelperService } from 'app/ui/core/address-helper.service';
import { MapsService } from 'app/ui/core/maps.service';
import { htmlCollectionToArray } from 'app/shared/helper';

/**
 * Shows a static image for an address location
 */
@Component({
  selector: 'static-map',
  templateUrl: 'static-map.component.html',
  styleUrls: ['static-map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaticMapComponent implements OnInit, OnChanges {

  @Input() address: Address;
  @Input() width: number | 'auto' = 'auto';
  @Input() height: number | 'auto' = 260;

  @ViewChild('anchor', { static: true }) anchor: ElementRef<HTMLAnchorElement>;

  @Output() imageLoaded = new EventEmitter();

  externalUrl: string;
  title: string;
  imageWidth: number;
  imageHeight: number;
  anchorHeight: string;
  private imageLoadedNotified = false;

  constructor(
    private maps: MapsService,
    private el: ElementRef,
    private addressHelper: AddressHelperService) {
  }

  ngOnInit() {
    this.title = this.address.addressLine1 || this.addressHelper.addressStreet(this.address);
    this.externalUrl = this.maps.externalUrl(this.address);
    this.update();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.width || changes.height) {
      this.update();
    }
  }

  private update() {
    if (typeof this.height === 'number') {
      this.anchorHeight = `${this.height}px`;
    } else {
      this.anchorHeight = null;
    }
    this.updateDimensions();
  }

  private updateDimensions(timeout = 0) {
    if (typeof this.width === 'number') {
      this.imageWidth = this.width;
    }
    if (typeof this.height === 'number') {
      this.imageHeight = this.height;
    }
    if (this.width === 'auto' || this.height === 'auto') {
      // Need to figure out the actual dimensions
      setTimeout(() => {
        const element = this.element;
        if (element.offsetWidth === 0) {
          // Not displayed yet.
          this.updateDimensions(300);
        } else {
          // Update the widths and then update the URL
          if (this.width === 'auto') {
            this.imageWidth = element.offsetWidth;
          }
          if (this.height === 'auto') {
            this.imageHeight = element.offsetHeight;
          }
          this.doInitUrl();
        }
      }, timeout);
    } else {
      this.doInitUrl();
    }
  }

  private doInitUrl() {
    if (this.imageWidth && this.imageHeight) {
      const url = this.maps.staticUrl(this.address, this.imageWidth, this.imageHeight);
      const anchor = this.anchor.nativeElement;
      const img = document.createElement('img');
      img.src = url;
      img.title = this.title;
      img.alt = this.title;
      if (!this.imageLoadedNotified) {
        img.addEventListener('load', () => this.triggerImageLoaded(), false);
        this.imageLoadedNotified = true;
      }
      img.style.maxWidth = `${this.imageWidth}px`;
      img.style.maxHeight = `${this.imageHeight}px`;
      for (const child of htmlCollectionToArray(anchor.childNodes)) {
        anchor.removeChild(child);
      }
      anchor.appendChild(img);
    }
  }

  private get element(): HTMLElement {
    return this.el.nativeElement;
  }

  triggerImageLoaded() {
    this.imageLoaded.emit();
  }
}
