import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Messages } from 'app/messages/messages';

/**
 * Component shown when the URL is not a recognized component
 */
@Component({
  selector: 'not-found',
  templateUrl: 'not-found.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundComponent {
  constructor(public messages: Messages) {
  }
}
