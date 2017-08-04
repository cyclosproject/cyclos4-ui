import { Component, OnInit, Input } from '@angular/core';

/**
 * Represents a page
 */
@Component({
  selector: 'page',
  templateUrl: 'page.component.html',
  styleUrls: ['page.component.scss']
})
export class PageComponent implements OnInit {
  constructor() { }

  @Input()
  public title: string;

  ngOnInit() { }
}