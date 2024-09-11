import { Injectable } from '@angular/core';
import { StoredFile } from 'app/api/models';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';

/**
 * Contains a cache for `StoredFile` models by id
 */
@Injectable({
  providedIn: 'root'
})
export class StoredFileCacheService {
  private cache = new Map<string, StoredFile>();

  constructor(dataForFrontendHolder: DataForFrontendHolder) {
    dataForFrontendHolder.subscribe(dataForFrontend => {
      const auth = ((dataForFrontend || {}).dataForUi || {}).auth;
      const user = (auth || {}).user;
      if (!user) {
        // Whenever the user logs out, clear the cache, as other users that could login in the same browser can't see the previous cached elements
        this.clear();
      }
    });
  }

  /**
   * Clears the cache.
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Deletes a stored file from the cache.
   */
  delete(id: string) {
    if (id) {
      this.cache.delete(id);
    }
  }

  /**
   * Writes a stored file to the cache only if it has a defined id. The id must be used to retrieve teh stored file from cache.
   * @param file The file to write into the cache
   */
  write(file: StoredFile) {
    if (file?.id) {
      this.cache.set(file.id, file);
    }
  }
  /**
   * Reads the stored file associanted to the given id (if any)
   * @param key The stored file id
   */
  read(id: string): StoredFile {
    return this.cache.get(id);
  }

  /**
   * Returns if the given id is in the cache
   * @param key The stored file id
   */
  contains(id: string): boolean {
    return this.cache.has(id);
  }

  /**
   * Returns the cached elements count
   */
  size() {
    return this.cache.size;
  }
}
