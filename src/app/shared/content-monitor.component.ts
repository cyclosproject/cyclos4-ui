import { Component, ChangeDetectionStrategy, EventEmitter, Output, AfterContentInit, HostBinding } from '@angular/core';

/**
 * Emits an event when the content is ready
 */
@Component({
  selector: 'content-monitor',
  templateUrl: 'content-monitor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContentMonitorComponent implements AfterContentInit {

  @HostBinding('style.display') styleDisplay = 'flex';
  @HostBinding('style.flexDirection') styleDirection = 'column';
  @HostBinding('style.width') styleWidth = '100%';

  @Output() ready = new EventEmitter<boolean>();

  ngAfterContentInit() {
    this.ready.emit(true);
  }
}
