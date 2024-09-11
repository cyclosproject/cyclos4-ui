import { Inject, Injectable } from '@angular/core';
import { ImportedFileKind, ImportedFileStatusEnum, ImportedLineStatusEnum, User } from 'app/api/models';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { MenuService } from 'app/ui/core/menu.service';
import { Menu } from 'app/ui/shared/menu';

/**
 * Helper service for imports functions
 */
@Injectable({
  providedIn: 'root'
})
export class ImportsHelperService {
  constructor(@Inject(I18nInjectionToken) private i18n: I18n, private menu: MenuService) {}

  kindLabel(kind: ImportedFileKind): string {
    switch (kind) {
      case ImportedFileKind.ADS:
        return this.i18n.imports.kind.ads;
      case ImportedFileKind.GENERAL_REFERENCES:
        return this.i18n.imports.kind.generalReferences;
      case ImportedFileKind.PAYMENTS:
        return this.i18n.imports.kind.payments;
      case ImportedFileKind.RECORDS:
        return this.i18n.imports.kind.records;
      case ImportedFileKind.TOKENS:
        return this.i18n.imports.kind.tokens;
      case ImportedFileKind.TRANSFERS:
        return this.i18n.imports.kind.transfers;
      case ImportedFileKind.USERS:
        return this.i18n.imports.kind.users;
      case ImportedFileKind.USER_PAYMENTS:
        return this.i18n.imports.kind.userPayments;
      case ImportedFileKind.USER_SEND_VOUCHERS:
        return this.i18n.imports.kind.userSendVouchers;
    }
  }

  fileStatusLabel(fileStatus: ImportedFileStatusEnum): string {
    switch (fileStatus) {
      case ImportedFileStatusEnum.ABORTED:
        return this.i18n.imports.fileStatus.aborted;
      case ImportedFileStatusEnum.ARCHIVED:
        return this.i18n.imports.fileStatus.archived;
      case ImportedFileStatusEnum.IMPORTED:
        return this.i18n.imports.fileStatus.imported;
      case ImportedFileStatusEnum.IMPORTING:
        return this.i18n.imports.fileStatus.importing;
      case ImportedFileStatusEnum.INTERNAL_ERROR:
        return this.i18n.imports.fileStatus.internalError;
      case ImportedFileStatusEnum.INVALID:
        return this.i18n.imports.fileStatus.invalid;
      case ImportedFileStatusEnum.READING_CSV:
        return this.i18n.imports.fileStatus.readingCsv;
      case ImportedFileStatusEnum.READING_ZIP:
        return this.i18n.imports.fileStatus.readingZip;
      case ImportedFileStatusEnum.READY:
        return this.i18n.imports.fileStatus.ready;
    }
  }

  lineStatusLabel(lineStatus: ImportedLineStatusEnum): string {
    switch (lineStatus) {
      case ImportedLineStatusEnum.IMPORTED:
        return this.i18n.imports.lineStatus.imported;
      case ImportedLineStatusEnum.IMPORT_ERROR:
        return this.i18n.imports.lineStatus.importError;
      case ImportedLineStatusEnum.READY:
        return this.i18n.imports.lineStatus.ready;
      case ImportedLineStatusEnum.SKIPPED:
        return this.i18n.imports.lineStatus.skipped;
      case ImportedLineStatusEnum.VALIDATION_ERROR:
        return this.i18n.imports.lineStatus.validationError;
    }
  }

  importedRowUrl(kind: ImportedFileKind, id: string) {
    if (!id) {
      return null;
    }
    switch (kind) {
      case ImportedFileKind.ADS:
        return `/marketplace/view/${id}`;
      case ImportedFileKind.GENERAL_REFERENCES:
        return `/users/references/view/${id}`;
      case ImportedFileKind.PAYMENTS:
      case ImportedFileKind.USER_PAYMENTS:
        return `/banking/transaction/${id}`;
      case ImportedFileKind.RECORDS:
        return `/records/view/${id}`;
      case ImportedFileKind.TOKENS:
        return `/users/tokens/view/${id}`;
      case ImportedFileKind.TRANSFERS:
        return `/banking/transfer/${id}`;
      case ImportedFileKind.USERS:
        return `/users/${id}/profile`;
    }
  }

  resolveMenu(file: { status?: ImportedFileStatusEnum; user?: User }) {
    return this.menu.userMenu(file?.user, Menu.PAYMENT_IMPORTS);
  }
}
