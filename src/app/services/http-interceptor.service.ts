import {
    HttpErrorResponse,
    HttpEvent,
    HttpHeaders,
    HttpInterceptorFn,
    HttpRequest
} from '@angular/common/http';
import { EMPTY, Subject, throwError, timer } from 'rxjs';
import { finalize, retry, takeUntil, timeout } from 'rxjs/operators';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Router, NavigationStart } from '@angular/router';
import { LoadingService } from './loading.service';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const loading = inject(LoadingService);

    // subject dibuat per instance handler, agar tidak global dan aman secara reaktif
    let cancelPending$ = new Subject<void>();
    let checkTimeout = true;

    // listen ke router events (cancel request saat navigasi)
    router.events.subscribe(event => {
        if (event instanceof NavigationStart) {
            cancelPending$.next();
            cancelPending$.complete();
            cancelPending$ = new Subject<void>();
        }
    });

    const shouldRetry = (error: HttpErrorResponse) => {
        if (error.status === 409 || error.status === 0) {
            return timer(200);
        }
        return throwError(() => error);
    };

    // salin header dasar
    const httpHeaders = new HttpHeaders({ Accept: 'application/json' });
    let headers = httpHeaders;
    const doNotCancel = req.headers.has('X-Do-Not-Cancel-On-Navigate');
    req.headers.delete('X-Do-Not-Cancel-On-Navigate');

    // request login / forgot / reset tidak perlu token
    if (
        req.url.includes('auth/login') ||
        req.url.includes('auth/forgot-password') ||
        req.url.includes('auth/reset-password')
    ) {
        const _req = req.clone({ headers, responseType: 'json', reportProgress: true });
        return next(_req);
    }

    // tambahkan token ke header
    const tokenData = auth.getTokenData() || {};
    const token = tokenData.token_type + ' ' + tokenData.access_token;
    headers = headers.append('Authorization', token);

    const _req = req.clone({
        headers,
        responseType: 'json',
        reportProgress: true
    });

    if (req.url.includes('auth/refresh') || req.url.includes('auth/logout')) {
        checkTimeout = false;
    }

    if (checkTimeout && auth.checkTimeout()) {
        loading.done();
        return EMPTY;
    }

    let stream$ = next(_req);

    if (!doNotCancel) {
        stream$ = stream$.pipe(
            takeUntil(cancelPending$),
            finalize(() => loading.done())
        );
    }

    return stream$.pipe(
        timeout(90000),
        retry({ count: 2, delay: shouldRetry }),
        finalize(() => checkTimeout && auth.refreshTimeout())
    );
};
