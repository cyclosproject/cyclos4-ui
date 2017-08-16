import { Component, OnInit, Input } from '@angular/core';

/**
 * Represents a section with title and content
 */
@Component({
  selector: 'section',
  templateUrl: 'section.component.html',
  styleUrls: ['section.component.scss']
})
export class SectionComponent implements OnInit {
  constructor() { }

  @Input()
  public title: string;

  ngOnInit() { }
}