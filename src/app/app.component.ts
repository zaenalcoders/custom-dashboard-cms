import { CommonModule } from '@angular/common';
import { AfterContentChecked, AfterViewInit, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { SidenavService } from './services/sidenav.service';
import { LoadingService } from './services/loading.service';
import { NavbarComponent } from "./components/navbar/navbar.component";
import { SidenavComponent } from "./components/sidenav/sidenav.component";

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        CommonModule,
        RouterOutlet,
        NavbarComponent,
        SidenavComponent
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, AfterContentChecked {
    auth = inject(AuthService);
    sidenav = inject(SidenavService);
    loading = inject(LoadingService);
    cdr = inject(ChangeDetectorRef);

    ngOnInit(): void {
        document.fonts.ready.then(() => {
            document.documentElement.classList.add('fonts-loaded');
        });
    }

    ngAfterContentChecked(): void {
        this.cdr.detectChanges();
    }
}
