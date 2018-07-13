import {
  Component, ChangeDetectionStrategy, EventEmitter, Output, Input,
  ChangeDetectorRef, ContentChild, TemplateRef, OnInit
} from '@angular/core';
import { DndDropEvent } from 'ngx-drag-drop';
import { ReorderableItemDirective } from 'app/shared/reorderable-item.directive';
import { ReorderablePlaceholderDirective } from 'app/shared/reorderable-placeholder.directive';

/**
 * A list whose elements can be reordered by drag / drop
 */
@Component({
  selector: 'reorderable-list',
  templateUrl: 'reorderable-list.component.html',
  styleUrls: ['reorderable-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReorderableListComponent implements OnInit {

  constructor(private changeDetector: ChangeDetectorRef) { }

  @Input() items = [];
  @Input() matchBy = 'id';
  @Output() reordered = new EventEmitter<Array<any>>();
  @Output() changed = new EventEmitter<boolean>();
  @ContentChild(ReorderableItemDirective, { read: TemplateRef }) itemTemplate;
  @ContentChild(ReorderablePlaceholderDirective, { read: TemplateRef }) placeholderTemplate;

  private originalItems;

  ngOnInit() {
    // Make copies of the items to not modify the original array
    this.items = this.items.slice();
    this.originalItems = this.items.slice();
  }

  onDrop(event: DndDropEvent) {
    // Swap the items
    const item = event.data;
    const prop = this.matchBy;
    const oldIndex = this.items.findIndex(i => i[prop] === item[prop]);
    const newIndex = event.index;
    if (newIndex > oldIndex) {
      // Have to subtract 1 as the old element is just hidden, but duplicated for now
      this.items.splice(newIndex, 0, item);
      this.items.splice(oldIndex, 1);
    } else {
      this.items.splice(oldIndex, 1);
      this.items.splice(newIndex, 0, item);
    }

    // Check whether the list has changed from its original sequence
    let changed = false;
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i][prop] !== this.originalItems[i][prop]) {
        changed = true;
        break;
      }
    }

    // Emit the events
    this.reordered.emit(this.items);
    this.changed.emit(changed);
    this.changeDetector.detectChanges();
  }
}
