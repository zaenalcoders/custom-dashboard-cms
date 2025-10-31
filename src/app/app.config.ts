import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { httpInterceptor } from './services/http-interceptor.service';
import { provideToastr } from 'ngx-toastr';

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideAnimationsAsync(),
        provideHttpClient(withInterceptors([httpInterceptor])),
        provideToastr({
            timeOut: 3000, // Duration for the toast to be displayed
            positionClass: 'toast-top-right', // Position on the screen
            preventDuplicates: true, // Prevent duplicate toasts
        }),
    ]
};
