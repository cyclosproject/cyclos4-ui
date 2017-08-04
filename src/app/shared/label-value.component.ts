import { Component, OnInit, Input } from '@angular/core';

/**
 * Displays a label / value pair
 */
@Component({
  selector: 'label-value',
  templateUrl: 'label-value.component.html',
  styleUrls: ['label-value.component.scss']
})
export class LabelValueComponent implements OnInit {
  constructor() { }

  @Input()
  public label: string;

  ngOnInit() { }
}