import { Component, OnInit, Input } from '@angular/core';

/**
 * Displays actions, normally buttons
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'actions',
  templateUrl: 'actions.component.html',
  styleUrls: ['actions.component.scss']
})
export class ActionsComponent implements OnInit {

  @Input() topMargin: 'normal' | 'double' | 'half' | 'small' | 'none' = 'normal';
  @Input() align: string;
  @Input() buttonSpace: 'normal' | 'small' | 'equidistant' | 'none' = 'normal';
  @Input() xsMode: 'column' | 'column-reverse' | 'row' = 'column-reverse';

  constructor() { }

  ngOnInit() { }

}
