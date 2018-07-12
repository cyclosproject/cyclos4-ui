import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { AdCategoryWithChildren, Image } from 'app/api/models';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Messages } from 'app/messages/messages';

/**
 * Component shown in a dialog to pick a sub-category
 */
@Component({
  selector: 'sub-category-dialog',
  templateUrl: 'sub-category-dialog.component.html',
  styleUrls: ['sub-category-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubCategoryDialogComponent {

  category: AdCategoryWithChildren;
  icon: string;
  image: Image;
  color: string;

  constructor(
    public dialogRef: MatDialogRef<SubCategoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public messages: Messages) {
    this.category = data.category;
    this.icon = data.icon;
    this.image = data.image;
    this.color = data.color;
  }

  select(child: AdCategoryWithChildren) {
    this.dialogRef.close(child);
  }
}
