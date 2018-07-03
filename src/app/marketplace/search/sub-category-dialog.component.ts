import { Component, ChangeDetectionStrategy, Input, Optional, Inject } from '@angular/core';
import { AdCategoryWithChildren, Image } from 'app/api/models';
import { environment } from 'environments/environment';
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

  constructor(
    public dialogRef: MatDialogRef<SubCategoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public category: AdCategoryWithChildren,
    public messages: Messages) {
  }

  select(child: AdCategoryWithChildren) {
    this.dialogRef.close(child);
  }
}
