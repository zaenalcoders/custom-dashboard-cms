import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { LoadingService } from '../../../services/loading.service';
import { AuthService } from '../../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
    title = inject(Title);
    loading = inject(LoadingService);
    auth = inject(AuthService);
    router = inject(Router);
    route = inject(ActivatedRoute);
    el = inject(ElementRef);
    toastr = inject(ToastrService);
    showPassword = false;
    loginForm = new FormGroup({
        email: new FormControl('', [Validators.required]),
        password: new FormControl('', [Validators.required])
    })

    submitForm(loginForm: FormGroup): void {
        if (!loginForm.valid) {
            this.el.nativeElement.querySelectorAll('[formcontrolname].ng-invalid')?.[0].focus();
            return;
        }
        this.showPassword = false;
        loginForm.disable();
        this.auth.login(loginForm.value.email, loginForm.value.password).then((res: any) => {
            if (res.success) {
                const returnUrl = this.route.snapshot.queryParams['return'] || '/';
                this.router.navigateByUrl(returnUrl);
                this.title.setTitle('Home');
            } else {
                loginForm.enable();
                if (res.response && res.response.wrong) {
                    Object.keys(res.response.wrong).forEach((key) => {
                        loginForm.get(key)?.setErrors({ serverError: res.response.wrong[key][0] });
                        this.el.nativeElement.querySelectorAll('[formcontrolname="' + key + '"]')?.[0]?.focus();
                    });
                    return;
                }
                const title = res.response?.message || 'Oops';
                const desc = res.response?.description || 'Unknown Error';
                this.toastr.error(desc, title);
            }
        });
    }

    ngOnInit(): void {
        this.title.setTitle('Login');
    }

}
