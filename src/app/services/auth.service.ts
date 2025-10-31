import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom, Subject } from 'rxjs';
import { EncryptService } from './encrypt.service';
import { LoadingService } from './loading.service';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    constructor(private http: HttpClient, private router: Router, private loading: LoadingService) { }

    isTimeOut: Subject<boolean> = new Subject<boolean>();
    private apiUrl = environment.apiUrl;
    private timeout: any = null;

    private HttpHeaders = new HttpHeaders({
        Accept: 'application/json',
    });

    private HttpOptions: any = {
        headers: this.HttpHeaders,
        responType: 'json',
        reportProgress: true
    };

    private cekAuth(): any {
        const cookie = localStorage.getItem('_' + environment.appName + '.globals') || null;
        if (!cookie) {
            return null;
        }
        try {
            let encParse = JSON.parse(EncryptService.decrypt(cookie)) || null;
            return encParse;
        } catch (e) {
            return null;
        }
    }

    isLoggedIn(): boolean {
        const authData = this.cekAuth();
        if (authData === null) {
            return false;
        }
        if (!authData.token_type || !authData.access_token) {
            return false;
        }
        if (!authData.user) {
            return false;
        }
        if (!authData.user?.name || !authData.user?.email) {
            return false;
        }
        return true;
    }

    reload(): void {
        this.loading.start();
        let authData = this.cekAuth() || {};
        const headers = this.HttpHeaders.append('Authorization', authData.token_type + ' ' + authData.access_token);
        this.HttpOptions.headers = headers;
        lastValueFrom(this.http.get(this.apiUrl + '/auth/profile', this.HttpOptions))
            .then((e: any) => {
                const user = e.result;
                this.setUserData(user);
            })
            .finally(() => {
                this.loading.done();
            });
    }

    logout(NoRedirect = false, direct = false): any {
        clearTimeout(this.timeout);
        if (direct) {
            localStorage.removeItem('_' + environment.appName + '.globals');
            if (!NoRedirect) {
                this.router.navigate(['login']);
            }
            return;
        }
        this.loading.start();
        const authToken = this.cekAuth() || {};
        const headers = this.HttpHeaders.append('Authorization', authToken.token_type + ' ' + authToken.access_token);
        this.HttpOptions.headers = headers;
        return lastValueFrom(this.http.get(this.apiUrl + '/auth/logout', this.HttpOptions))
            .then(() => { return true; })
            .catch(() => { return true; })
            .finally(() => {
                localStorage.removeItem('_' + environment.appName + '.globals');
                if (!NoRedirect) {
                    this.router.navigate(['login']);
                }
                this.loading.done();
            });
    }

    login(email: string, password: string, keepLogin = false): any {
        this.loading.start();
        const data = new FormData();
        data.append('email', email);
        data.append('password', password);
        if (keepLogin) {
            data.append('keepLogin', 'true');
        }
        return lastValueFrom(this.http.post(this.apiUrl + '/auth/login', data, this.HttpOptions))
            .then((resp: any) => {
                this.saveAuth(resp.result);
                return { success: true };
            }).catch((err) => {
                return { success: false, response: err.error };
            })
            .finally(() => {
                this.loading.done();
            });
    }

    forgotPassword(email: string): any {
        this.loading.start();
        const data = new FormData();
        data.append('email', email);
        return lastValueFrom(this.http.post(this.apiUrl + '/auth/forgot-password', data, this.HttpOptions))
            .then(() => {
                return { success: true };
            }).catch((err) => {
                return { success: false, response: err.error };
            })
            .finally(() => {
                this.loading.done();
            });
    }

    resetPassword(password: string, password_confirmation: string, token: any): any {
        this.loading.start();
        const data = new FormData();
        data.append('password', password);
        data.append('password_confirmation', password_confirmation);
        data.append('token', token);
        return lastValueFrom(this.http.post(this.apiUrl + '/auth/reset-password', data, this.HttpOptions))
            .then(() => {
                return { success: true };
            }).catch((err) => {
                return { success: false, response: err.error };
            })
            .finally(() => {
                this.loading.done();
            });
    }

    getUserData(): any {
        if (!this.isLoggedIn()) {
            return null;
        }
        const authData = this.cekAuth();
        return authData.user;
    }

    setUserData(userData: any) {
        const authData = this.cekAuth();
        if (authData) {
            authData.user = userData;
            const newAuthData = EncryptService.encrypt(JSON.stringify(authData));
            localStorage.setItem('_' + environment.appName + '.globals', newAuthData);
        }
    }

    getTokenData(): any {
        if (!this.isLoggedIn()) {
            return null;
        }
        const authData = this.cekAuth();
        delete authData.user;
        return authData;
    }

    setTokenData(tokenData: any) {
        const authData = this.cekAuth();
        if (!authData) {
            return;
        }
        let newAuthData: any = tokenData || {};
        newAuthData.user = authData.user;
        const encryptAuth = EncryptService.encrypt(JSON.stringify(newAuthData));
        localStorage.setItem('_' + environment.appName + '.globals', encryptAuth);
    }

    saveAuth(authData: any): void {
        const date = new Date();
        date.setSeconds(date.getSeconds() + authData.timeout);
        authData.expires = date.getTime();
        const encAuth = EncryptService.encrypt(JSON.stringify(authData));
        localStorage.setItem('_' + environment.appName + '.globals', encAuth);
        delete authData.user;
        this.refreshTimeout(authData);
    }

    checkTimeout(): boolean {
        const authData = this.getTokenData();
        if (!authData) {
            this.isTimeOut.next(true);
            return true;
        }
        const current_time = (new Date()).getTime();
        const auth_expires = authData.expires;
        const isTimeOut = current_time > auth_expires;
        const calcLogout = (current_time - auth_expires) / 1000;
        if (calcLogout > 36000) {
            this.logout(false, true);
        } else if (isTimeOut) {
            this.isTimeOut.next(true);
        }
        return isTimeOut;
    }

    refreshTimeout(tokenData?: any): void {
        const authData = tokenData ? tokenData : this.getTokenData();
        clearTimeout(this.timeout);
        if (!authData) {
            return;
        }
        const date = new Date();
        date.setSeconds(date.getSeconds() + authData.timeout);
        authData.expires = date.getTime();
        this.setTokenData(authData);
        this.isTimeOut.next(false);
        this.timeout = setTimeout(() => {
            this.isTimeOut.next(true);
        }, authData.timeout * 1000);
    }
}
