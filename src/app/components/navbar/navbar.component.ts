import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbDropdown, NgbDropdownMenu, NgbDropdownToggle, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../services/auth.service';
import { SidenavService } from '../../services/sidenav.service';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from "../avatar/avatar.component";
import { BreadcrumbComponent } from "../breadcrumb/breadcrumb.component";

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [
        CommonModule,
        AvatarComponent,
        NgbDropdown,
        BreadcrumbComponent,
        NgbDropdownMenu,
        NgbDropdownToggle,
        NgbTooltip
    ],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {

    constructor(
        public sidenav: SidenavService,
        private auth: AuthService,
        private router: Router,
        private modalService: NgbModal,
        private toastr: ToastrService
    ) { }

    @ViewChild('logoutModal') logoutModal: any;
    userData: any = {};
    lModal: any;
    loading = false;
    notifInterval: any = null;

    logout(): void {
        this.lModal = this.modalService.open(this.logoutModal, { backdrop: 'static', keyboard: false, centered: true });
    }

    goLogout(): void {
        localStorage.removeItem('_' + environment.appName + '.skipTelegram');
        clearInterval(this.notifInterval);
        this.loading = true;
        this.auth.logout().then(() => {
            this.lModal.close();
            this.loading = false;
        });
    }

    ngOnInit(): void {
        this.userData = this.auth.getUserData() || {};
    }
}
