import { CommonModule } from '@angular/common';
import { AfterContentChecked, ChangeDetectorRef, Component, ElementRef, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { SidenavService } from './services/sidenav.service';
import { LoadingService } from './services/loading.service';
import { NavbarComponent } from "./components/navbar/navbar.component";
import { SidenavComponent } from "./components/sidenav/sidenav.component";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpService } from './services/http.service';
import { AutoFocusDirective } from "./directives/auto-focus.directive";

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
    CommonModule,
    RouterOutlet,
    FormsModule,
    ReactiveFormsModule,
    NavbarComponent,
    SidenavComponent,
    AutoFocusDirective
],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, AfterContentChecked {
    auth = inject(AuthService);
    sidenav = inject(SidenavService);
    loading = inject(LoadingService);
    cdr = inject(ChangeDetectorRef);
    http = inject(HttpService);
    el = inject(ElementRef);
    router = inject(Router);
    loginForm = new FormGroup({
        password: new FormControl(),
    });
    userEmail: string | null = null;

    submitLogin(form: FormGroup): void {
        if (!form.valid) {
            this.el.nativeElement.querySelectorAll('.auth-form [formcontrolname].ng-invalid')[0]?.focus();
            return;
        }
        const fdata = form.value;
        form.disable();
        this.http.Update('auth/refresh', fdata).then((r: any) => {
            form.enable();
            if (r.success) {
                this.loginForm.reset();
                const data = r?.response?.result || {};
                this.auth.refreshTimeout(data);
                if (this.router.url == '/dashboard') {
                    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                        this.router.navigate([this.router.url]);
                    });
                }
            } else {
                if (r.response && r.response.wrong) {
                    Object.keys(r.response.wrong).forEach((key) => {
                        form.get(key)?.setErrors({ serverError: r.response.wrong[key][0] });
                        this.el.nativeElement.querySelectorAll('.auth-form [formcontrolname="' + key + '"]')?.[0]?.focus();
                    });
                }
            }
        });
    }

    authLogout(): void {
        this.auth.logout(false, true);
    }

    ngOnInit(): void {
        document.fonts.ready.then(() => {
            document.documentElement.classList.add('fonts-loaded');
        });
    }

    ngAfterContentChecked(): void {
        this.cdr.detectChanges();
    }
}
