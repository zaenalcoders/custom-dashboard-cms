import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PageQueryService {

    constructor(private router: Router, private activeRoute: ActivatedRoute) {
        this.activeRoute.queryParams.subscribe((e: any) => {
            this.resetQueryPage();
            Object.keys(e).forEach((v: any) => {
                this.queryPage[v] = e[v];
            });
            this.isSearch = this.queryPage.q;
            this.query?.next(this.queryPage);
        });
    }
    isSearch: boolean = false;
    queryPage: any = {
        q: null,
        limit: 10,
        page: 1
    };
    query: BehaviorSubject<any> = new BehaviorSubject(this.queryPage);
    private _queryEvent: any;

    init(callback?: Function): void {
        this._queryEvent = this.query.subscribe((e: any) => {
            this.queryPage = e;
            if (typeof (callback) == 'function') {
                callback();
            }
        });
    };

    destroy(): void {
        this.isSearch = false;
        this.queryPage = {
            q: null,
            limit: 10,
            page: 1
        };
        this._queryEvent.complete();
        this._queryEvent.unsubscribe();
    }

    searchData(ev: any): void {
        if (ev?.keyCode === 27) {
            this.changeRoute({ q: null });
            this.isSearch = false;
            this.resetQueryPage();
        }
        if (ev?.keyCode === 13) {
            this.changeRoute({ page: 1, q: this.queryPage.q });
        }
    }

    private resetQueryPage(): void {
        this.queryPage = {
            q: null,
            limit: 10,
            page: 1
        };
    }

    changeRoute(params: any): void {
        this.router.navigate([(this.router.url).split('?')[0]], {
            relativeTo: this.activeRoute,
            queryParams: params,
            queryParamsHandling: 'merge',
        });
    }
}
