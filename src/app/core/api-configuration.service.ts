import { Injectable } from '@angular/core';
import { ApiConfiguration } from "app/api/api-configuration";
import { environment } from "environments/environment"
import { ErrorHandlerService } from "app/core/error-handler.service";
import { NotificationService } from "app/core/notification.service";
import { RequestOptions } from "@angular/http";

const SESSION_TOKEN = "Session-Token";

/**
 * Service which handles the configuration of the API communication
 */
@Injectable()
export class ApiConfigurationService {

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private notificationService: NotificationService
  ) { }

  private nextAuth: string;

  /**
   * Sets the api configuration variables
   */
  setupApiConfiguration(): void {
    let root = environment.apiRoot as string;
    if (root.endsWith('/')) {
      root = root.substr(0, root.length - 1);
    }
    ApiConfiguration.rootUrl = environment.apiRoot
    ApiConfiguration.handleError = request => {
      this.errorHandlerService.handleHttpError(request);
    };
    ApiConfiguration.prepareRequestOptions = (options: RequestOptions) => {
      // This front-end is presented as main channel
      options.headers.set("Channel", "main");

      // Close any visible notification before sending a new request
      this.notificationService.close();

      // Send the session token if any
      if (this.nextAuth) {
        // Send the request as basic auth
        options.headers.set("Authorization", this.nextAuth);
        // Prevent subsequent requests from using this auth again
        this.nextAuth = null;
      } else {
        // Send the session token if any
        let sessionToken = localStorage.getItem(SESSION_TOKEN);
        if (sessionToken) {
          options.headers.append(SESSION_TOKEN, sessionToken);
        }
      }
    };
  }

  /**
   * Sets the next request to use a basic authentication.
   * Useful only for the request that performs the login.
   * @param principal The user principal
   * @param password The user password
   */
  nextAsBasic(principal: string, password: string): void {
    this.nextAuth = "Basic " + btoa(principal + ":" + password);
  }

  /**
   * Sets the value of the session token
   */
  set sessionToken(sessionToken: string) {
    if (sessionToken) {
      localStorage.setItem(SESSION_TOKEN, sessionToken);
    } else {
      localStorage.removeItem(SESSION_TOKEN);
    }
  }

  /**
   * Returns the value of the session prefix
   */
  get sessionToken(): string {
    return localStorage.getItem(SESSION_TOKEN);
  }

}