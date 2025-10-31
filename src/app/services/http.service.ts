import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { LoadingService } from './loading.service';
import { AuthService } from './auth.service';
import { lastValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Injectable({
    providedIn: 'root'
})
export class HttpService {
    constructor(
        private http: HttpClient,
        private auth: AuthService,
        private loading: LoadingService,
        private toast: ToastrService
    ) {
    }

    private apiUrl = environment.apiUrl;
    private cancelOnRoute = false;

    private handleError(err: any): void {
        if (err?.name == 'EmptyError' && (this.auth.checkTimeout() || this.cancelOnRoute)) {
            return;
        }
        let err_description = '';
        if (err.status == 401) {
            err_description = 'Authorization invalid, please re-login';
            if (environment.production) {
                this.auth.logout(false, true);
            }
        } else if (err.status == 0) {
            err_description = 'No Internet connection, please check your connection & try again later';
        } else if (err.status == 500 && environment.production) {
            err_description = 'Something went wrong, please try again later';
        } else {
            if (err.error?.wrong) {
                err_description = typeof (err.error.wrong) == 'object' ? Object.values(err.error.wrong).join('<br>') : (err.error.wrong).toString();
            } else {
                err_description = err.error?.description || err.error?.message || 'Unknown Error. Please contact Administrator';
            }
            if (err.status == 423) {
                this.auth.logout(false, true);
            }
        }
        const error = {
            title: environment.production ? 'Oops!' : err.statusText,
            message: err_description
        };
        this.toast.error(error.message, error.title, { enableHtml: true });
    }

    async Get(urlPath: string, params?: any, noLoading?: boolean, cancelOnRouteChange: boolean = true): Promise<{ success: boolean, response: any, permission: any }> {
        this.cancelOnRoute = cancelOnRouteChange;
        if (!noLoading) {
            this.loading.start();
        }
        let httpOptions: any = {};
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach((key) => {
                if (!params[key]) {
                    return;
                }
                const val = typeof (params[key]) == 'object' ? JSON.stringify(params[key]) : params[key];
                httpParams = httpParams.append(key, val);
            });
            httpOptions.params = httpParams;
        }
        const headers = new HttpHeaders({
            Accept: 'application/json',
            ...(cancelOnRouteChange === false ? { 'X-Do-Not-Cancel-On-Navigate': 'true' } : {})
        });
        httpOptions.headers = headers;
        httpOptions.observe = 'response';
        return lastValueFrom(this.http.get(this.apiUrl + '/' + urlPath, httpOptions))
            .then((resp: any) => {
                let permission = resp?.headers?.get('x-access');
                permission = permission ? JSON.parse(atob(permission) || '{}') : {};
                return { success: true, response: (resp?.body || {}), permission: permission };
            })
            .catch((err) => {
                this.handleError(err);
                return { success: false, response: err.error };
            })
            .finally(() => {
                if (!noLoading) {
                    this.loading.done();
                }
            }) as Promise<{ success: boolean, response: any, permission: any }>;
    }

    async Create(urlPath: string, data: object = {}, noLoading?: boolean, cancelOnRouteChange: boolean = true): Promise<{ success: boolean, response: any }> {
        this.cancelOnRoute = cancelOnRouteChange;
        if (!noLoading) {
            this.loading.start();
        }
        const httpOptions: any = {
            headers: new HttpHeaders({
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...(cancelOnRouteChange === false ? { 'X-Do-Not-Cancel-On-Navigate': 'true' } : {})
            })
        };
        return lastValueFrom(this.http.post(this.apiUrl + '/' + urlPath, data, httpOptions))
            .then((resp) => {
                return { success: true, response: resp };
            })
            .catch((err) => {
                this.handleError(err);
                return { success: false, response: err.error };
            })
            .finally(() => {
                if (!noLoading) {
                    if (!noLoading) {
                        this.loading.done();
                    }
                }
            }) as Promise<{ success: boolean, response: any }>;
    }

    async Update(urlPath: string, data: object = {}, noLoading?: boolean, cancelOnRouteChange: boolean = true): Promise<{ success: boolean, response: any }> {
        this.cancelOnRoute = cancelOnRouteChange;
        if (!noLoading) {
            this.loading.start();
        }
        const httpOptions: any = {
            headers: new HttpHeaders({
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...(cancelOnRouteChange === false ? { 'X-Do-Not-Cancel-On-Navigate': 'true' } : {})
            })
        };
        return lastValueFrom(this.http.put(this.apiUrl + '/' + urlPath, data, httpOptions))
            .then((resp) => {
                return { success: true, response: resp };
            })
            .catch((err) => {
                this.handleError(err);
                return { success: false, response: err.error };
            })
            .finally(() => {
                if (!noLoading) {
                    if (!noLoading) {
                        this.loading.done();
                    }
                }
            }) as Promise<{ success: boolean, response: any }>;
    }

    async Upload(urlPath: string, fdata: FormData, noLoading?: boolean, cancelOnRouteChange: boolean = true): Promise<{ success: boolean, response: any }> {
        this.cancelOnRoute = cancelOnRouteChange;
        if (!noLoading) {
            this.loading.start();
        }
        const httpOptions: any = {
            headers: new HttpHeaders({
                Accept: 'application/json',
                ...(cancelOnRouteChange === false ? { 'X-Do-Not-Cancel-On-Navigate': 'true' } : {})
            })
        };
        return lastValueFrom(this.http.post(this.apiUrl + '/' + urlPath, fdata, httpOptions))
            .then((resp) => {
                return { success: true, response: resp };
            })
            .catch((err) => {
                this.handleError(err);
                return { success: false, response: err.error };
            })
            .finally(() => {
                if (!noLoading) {
                    if (!noLoading) {
                        this.loading.done();
                    }
                }
            }) as Promise<{ success: boolean, response: any }>;
    }

    async Delete(urlPath: string, data: Array<any>, noLoading?: boolean, cancelOnRouteChange: boolean = true): Promise<{ success: boolean, response: any }> {
        this.cancelOnRoute = cancelOnRouteChange;
        if (!noLoading) {
            this.loading.start();
        }
        const headers = new HttpHeaders({
            Accept: 'application/json',
            ...(cancelOnRouteChange === false ? { 'X-Do-Not-Cancel-On-Navigate': 'true' } : {})
        });
        return lastValueFrom(this.http.delete(this.apiUrl + '/' + urlPath, { body: data, headers: headers }))
            .then((resp) => {
                return { success: true, response: resp };
            })
            .catch((err) => {
                this.handleError(err);
                return { success: false, response: err.error };
            })
            .finally(() => {
                if (!noLoading) {
                    if (!noLoading) {
                        this.loading.done();
                    }
                }
            }) as Promise<{ success: boolean, response: any }>;
    }
}
