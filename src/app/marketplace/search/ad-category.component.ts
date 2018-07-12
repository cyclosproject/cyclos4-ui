import { Component, ChangeDetectionStrategy, Injector, Input, EventEmitter, Output } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { AdCategoryWithChildren, Image } from 'app/api/models';
import { environment } from 'environments/environment';
import { MatDialog } from '@angular/material';
import { SubCategoryDialogComponent } from 'app/marketplace/search/sub-category-dialog.component';

const MAX_CHILD = 5;

/**
 * Displays an advertisement category with it's sub-categories
 */
@Component({
  selector: 'ad-category',
  templateUrl: 'ad-category.component.html',
  styleUrls: ['ad-category.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdCategoryComponent extends BaseComponent {

  constructor(
    injector: Injector,
    private dialog: MatDialog) {
    super(injector);
  }

  @Input() category: AdCategoryWithChildren;

  @Input() hideChildren = false;

  @Input() tileWidth: number;

  @Input() limit = MAX_CHILD;

  @Output() selection = new EventEmitter<AdCategoryWithChildren>();

  showShowAll = true;

  ngOnInit() {
    super.ngOnInit();
    if (this.limit == null) {
      this.limit = 0;
    }
    const children = this.category.children || [];
    this.showShowAll = this.limit > 0 && children.length > this.limit + 1;
  }

  get icon(): string {
    const icons = environment.adCategoryIcons || {};
    return icons[this.category.internalName];
  }

  get color(): string {
    const colors = environment.adCategoryColors || {};
    return colors[this.category.internalName];
  }

  get image(): Image {
    return this.icon ? null : this.category.image;
  }

  get children(): AdCategoryWithChildren[] {
    const children = this.category.children || [];
    if (this.limit > 0 && children.length > this.limit + 1) {
      return children.slice(0, this.limit);
    }
    return children;
  }

  get spaces(): string[] {
    if (this.limit <= 0) {
      return [];
    }
    const children = this.category.children || [];
    const number = this.limit - children.length;
    return number <= 0 ? [] : ' '.repeat(number).split('');
  }

  showAll() {
    this.dialog.open(SubCategoryDialogComponent, {
      data: {
        category: this.category,
        icon: this.icon,
        image: this.image,
        color: this.color
      },
      autoFocus: false,
      width: '400px'
    }).afterClosed().subscribe(selected => {
      if (selected) {
        this.selection.emit(selected);
      }
    });
  }
}
