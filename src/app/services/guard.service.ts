import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

export const afterLogin: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
        router.navigate(['login'], { queryParams: { return: state.url } });
    }
    return auth.isLoggedIn();
}

export const beforeLogin: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isLoggedIn()) {
        router.navigate(['dashboard']);
    }
    return !auth.isLoggedIn();
}