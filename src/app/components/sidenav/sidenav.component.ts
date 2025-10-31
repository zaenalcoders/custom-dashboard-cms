import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { SidenavService } from '../../services/sidenav.service';
import { BehaviorSubject, Subject } from 'rxjs';

@Component({
    selector: 'app-sidenav',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink
    ],
    templateUrl: './sidenav.component.html',
    styleUrl: './sidenav.component.scss'
})
export class SidenavComponent implements OnInit {

    constructor(
        public sidenav: SidenavService,
        public location: Location,
        private router: Router,
        private el: ElementRef
    ) { }

    currentPath: string = '';
    isCollapsed: boolean[] = [];
    navData = new BehaviorSubject<any[]>([]);

    @HostListener('window:resize', ['$event'])
    onResize(_event: any): void {
        this.sidenav.windowSize = window.innerWidth;
        if (window.innerWidth <= 991) {
            this.sidenav.close();
            this.sidenav.isMobile = true;
        } else {
            this.sidenav.open();
            this.sidenav.isMobile = false;
        }
    }

    isActive(path: string): boolean {
        const cPath = this.currentPath.split('/');
        const qPath = cPath?.[0]?.split('?');
        return path == qPath?.[0];
    }

    toggleNav(i: number): void {
        this.isCollapsed.forEach((_, e) => {
            if (e == i) {
                this.isCollapsed[e] = !this.isCollapsed[e];
            } else {
                this.isCollapsed[e] = false;
            }
        })
    }

    expandNav(): void {
        const el = this.el.nativeElement.querySelectorAll('.sub-nav a.active');
        if (!el.length) {
            return;
        }
        const idx = el[0].parentNode.parentNode.getAttribute('data-index') ?? -1;
        if (idx > -1) {
            this.toggleNav(idx);
        }
    }

    ngOnInit(): void {
        this.navData.next([
            { link: 'data-sources', icon: 'dns', name: 'Data Source' }
        ]);
        this.navData.subscribe(e => {
            (e).forEach(() => {
                this.isCollapsed.push(false);
            });
            setTimeout(() => {
                this.expandNav();
                setTimeout(() => {
                    const activeEl = this.el.nativeElement.querySelectorAll('.nav-link.active')?.[0];
                    if (activeEl) {
                        activeEl.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);
            }, 100);
        });
        this.router.events.pipe(filter(event => event instanceof NavigationEnd),
            distinctUntilChanged()
        ).subscribe((event: any) => {
            let url: string = event?.url.split('#')[0];
            url = url.substring(1) || 'dashboard';
            this.currentPath = url;
        });
    }
}
