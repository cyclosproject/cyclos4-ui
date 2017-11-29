import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

export type TitleSize = 'regular' | 'small';

/**
 * Represents a section with title and content
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'section',
  templateUrl: 'section.component.html',
  styleUrls: ['section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionComponent implements OnInit {
  constructor() { }

  @Input() margin: boolean | string;

  @Input() title: string;

  @Input() titleSize: TitleSize = 'regular';

  ngOnInit() { }
}
