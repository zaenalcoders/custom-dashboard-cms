import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { SidenavService } from '../../services/sidenav.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-breadcrumb',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './breadcrumb.component.html',
    styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit {

    constructor(
        private router: Router,
        private sidenav: SidenavService,
        private title: Title
    ) { }

    linkList: Subject<Array<any>> = new Subject();
    countList = 0;

    ngOnInit(): void {
        this.router.events.pipe(filter(event => event instanceof NavigationEnd),
            distinctUntilChanged()
        ).subscribe((event: any) => {
            let url: any = event?.url?.split('?')[0];
            if (url == '/dashboard' || url == '/') {
                this.title.setTitle('Home');
                this.countList = 0;
                if (window.innerWidth <= 991) {
                    this.sidenav.close();
                }
                this.linkList.next([{ path: '/', data: { title: 'Dashboard' } }]);
                return;
            }
            url = url.substr(-(url.length - 1));
            url = url.split('/').filter((e: string) => e.length > 0);
            if (!url.length) {
                this.title.setTitle('Home');
                this.linkList.next([]);
                if (window.innerWidth <= 991) {
                    this.sidenav.close();
                }
                return;
            }
            let addLink: any = [];
            let routerList: Array<any> = [];
            this.router.config.forEach((item: any) => {
                if (item.children?.length) {
                    item.children.forEach((cItem: any) => {
                        const path = (cItem.path) ? item.path + '/' + cItem.path : item.path;
                        routerList.push({ path: path, data: cItem.data });
                    });
                } else {
                    routerList.push({ path: item.path, data: item.data });
                }
            });
            url.forEach((item: string) => {
                let _currentUrl = routerList.filter(e => {
                    return e.path == item;
                });
                if (_currentUrl.length) {
                    addLink.push({ path: '/' + _currentUrl[0].path, data: _currentUrl[0].data });
                }
            });
            url = url.join('/');
            let _currentUrl = routerList.map((e: any) => {
                if (e.path?.indexOf(':') > -1) {
                    const path = e.path?.split(':')[0];
                    let id = (url.split(path)[1] || '').split('/')[0];
                    if (id) {
                        e.path = e.path?.replace(/\:([a-zA-Z]+)/gmi, id);
                    }
                }
                return e;
            }).filter((e: any) => e.path == url);

            if (_currentUrl.length) {
                let filterAddLink = addLink.filter((e: any) => {
                    return e.path == '/' + _currentUrl[0].path;
                });
                if (!filterAddLink.length) {
                    addLink.push({ path: '/' + _currentUrl[0].path, data: _currentUrl[0].data });
                }
            }

            this.linkList.next(addLink);
        });
        this.linkList.subscribe(e => {
            this.countList = e.length;
            let str_title = 'Dashboard';
            if (e.length) {
                const route = e[e.length - 1] || {};
                str_title = route?.data?.title || 'Dashboard';
            }
            this.title.setTitle(str_title);
            if (window.innerWidth <= 991) {
                this.sidenav.close();
            }
        });
    }

}
