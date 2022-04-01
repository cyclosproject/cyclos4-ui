import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from 'app/api/models';
import { UsersService } from 'app/api/services/users.service';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { ErrorStatus } from 'app/core/error-status';
import { Observable, of } from 'rxjs';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';

/**
 * Contains a cache for `User` models by id / principal
 */
@Injectable({
  providedIn: 'root',
})
export class UserCacheService {

  private cache = new Map<string, User>();
  private invalidKeys = new Set<string>();

  constructor(
    private usersService: UsersService,
    private errorHandler: ErrorHandlerService,
    dataForFrontendHolder: DataForFrontendHolder) {

    dataForFrontendHolder.subscribe(dataForFrontend => {
      const auth = ((dataForFrontend || {}).dataForUi || {}).auth;
      const user = (auth || {}).user;
      if (!user) {
        // Whenever the user logs out, clear the cache, as other users that could login in the same browser can have different permissions
        this.cache.clear();
        this.invalidKeys.clear();
      }
    });
  }

  /**
   * Registers the given user(s) by id
   */
  register(users: User | User[]) {
    if (users == null) {
      users = [];
    }
    if (!(users instanceof Array)) {
      users = [users];
    }
    for (const user of users) {
      this.cache.set(user.id, user);
    }
  }

  /**
   * Returns an observable that fetches the user from the server, resolving to null if no user is found
   * @param key Either the user id or principal
   */
  get(key: string): Observable<User> {
    if (this.cache.has(key)) {
      return of(this.cache.get(key));
    } else if (this.invalidKeys.has(key)) {
      return of(null);
    } else {
      return new Observable(observer => {
        this.errorHandler.requestWithCustomErrorHandler(defaultHandling => {
          this.usersService.locateUser({
            user: key, fields: [
              'id', 'display', 'image'
            ],
          }).subscribe(user => {
            this.cache.set(key, user);
            if (user.id !== key) {
              this.cache.set(user.id, user);
            }
            observer.next(user);
            observer.complete();
          }, (err: HttpErrorResponse) => {
            if (err.status === ErrorStatus.NOT_FOUND) {
              this.invalidKeys.add(key);
              observer.next(null);
              observer.complete();
            } else {
              defaultHandling(err);
            }
          });
        });
      });
    }
  }
}
