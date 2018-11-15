import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostBinding, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { Address } from 'app/api/models';
import { MapsService } from 'app/core/maps.service';
import { ApiHelper } from 'app/shared/api-helper';

/**
 * Shows a static image for an address location
 */
@Component({
  selector: 'static-map',
  templateUrl: 'static-map.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaticMapComponent implements OnInit, AfterViewInit {

  @HostBinding('style.display') classDisplay = 'block';
  @HostBinding('style.flex-grow') classFlexGrow = '1';

  @Input() address: Address;
  @Input() width: number | 'auto' = 'auto';
  @Input() height: number | 'auto' = 200;

  url: string;
  externalUrl: string;
  title: string;
  imageWidth: string;
  imageHeight: string;

  constructor(
    private maps: MapsService,
    private el: ElementRef,
    private cd: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.title = this.address.addressLine1 || ApiHelper.addressStreet(this.address);
    this.externalUrl = this.maps.externalUrl(this.address);
  }

  ngAfterViewInit() {
    if (this.width === 'auto' || this.height === 'auto') {
      setTimeout(() => {
        const element = this.element;
        if (this.width === 'auto') {
          this.width = element.offsetWidth;
        }
        if (this.height === 'auto') {
          this.height = element.offsetHeight;
        }
        this.doInitUrl();
      }, 1);
    } else {
      this.doInitUrl();
    }
  }

  private doInitUrl() {
    if (typeof this.width === 'number' && typeof this.height === 'number') {
      this.url = this.maps.staticUrl(this.address, this.width, this.height);
      this.imageWidth = this.width + 'px';
      this.imageHeight = this.height + 'px';
      this.cd.detectChanges();
    }
  }

  private get element(): HTMLElement {
    return this.el.nativeElement;
  }
}
