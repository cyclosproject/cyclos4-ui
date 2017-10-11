import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

/**
 * Represents a section with title and content
 */
@Component({
  selector: 'section',
  templateUrl: 'section.component.html',
  styleUrls: ['section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionComponent implements OnInit {
  constructor() { }

  @Input() margin: boolean;
  
  @Input() title: string;

  ngOnInit() { }
}