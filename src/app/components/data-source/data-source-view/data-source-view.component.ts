import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbModal, NgbTooltip, NgbDropdown, NgbDropdownMenu, NgbDropdownToggle } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../services/http.service';
import { LoadingService } from '../../../services/loading.service';
import { ToastrService } from 'ngx-toastr';
import { PageQueryService } from '../../../services/page-query.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoFocusDirective } from '../../../directives/auto-focus.directive';
import { RouterLink } from '@angular/router';
import { SortableDirective } from '../../../directives/sortable.directive';

@Component({
    selector: 'app-data-source-view',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        AutoFocusDirective,
        RouterLink,
        NgbTooltip,
        NgbDropdown,
        NgbDropdownMenu,
        NgbDropdownToggle,
        SortableDirective,
    ],
    templateUrl: './data-source-view.component.html',
    styleUrl: './data-source-view.component.scss'
})
export class DataSourceViewComponent implements OnInit, OnDestroy {
    constructor(
        public pageQuery: PageQueryService,
        public loading: LoadingService,
        private http: HttpService,
        private modalService: NgbModal,
        private toastr: ToastrService
    ) { }
    @ViewChild('deleteModal') deleteModal: any;
    private apiPath = 'data-sources';
    data: any = {};
    permission: any = {};

    deleteDialog: any = {
        ids: [],
        isDeleting: false,
        modal: null,
        show: (ids: Array<any>) => {
            this.deleteDialog.ids = ids;
            this.deleteDialog.modal = this.modalService.open(this.deleteModal, { keyboard: false, backdrop: 'static', centered: true });
        },
        submit: () => {
            this.deleteDialog.isDeleting = true;
            let urlParameters = Object.entries(this.pageQuery.query.getValue()).filter(k => { return k[1] != null }).map(e => e.join('=')).join('&');
            this.http.Delete(this.apiPath + '/delete?' + urlParameters, this.deleteDialog.ids).then((r: any) => {
                this.deleteDialog.isDeleting = false;
                if (r.success) {
                    this.toastr.success('Data deleted successfully', 'Success');
                    const filteredData = (this.data.data || []).filter((i: any) => !this.deleteDialog.ids.includes(i.id));
                    this.data.data = filteredData;
                    this.deleteDialog.modal.close();
                }
            });
        }
    }

    setStatus(item: any, ev: any): void {
        const old_status = item.status;
        item.status = item.status ? 0 : 1;
        this.http.Update(this.apiPath + '/set-status', { id: item.id, status: item.status }).then((r: any) => {
            if (!r.success) {
                item.status = old_status;
                ev.target.checked = !ev.target.checked;
                return;
            }
            this.toastr.success('Changes saved successfully');
        });
    }

    getData(): void {
        const query: any = this.pageQuery.query.getValue() || {};
        this.http.Get(this.apiPath, query).then((r: any) => {
            if (r.success) {
                this.data = r?.response?.result || {};
                this.permission = r?.permission || {};
            }
        });
    }

    ngOnInit(): void {
        this.loading.start();
        this.pageQuery.init(() => {
            this.getData();
        });
    }

    ngOnDestroy(): void {
        this.pageQuery.destroy();
    }

    onSort(ev: any): void {
        const sort = ev.direction == 'desc' ? '-' + ev.column : ev.column;
        this.pageQuery.changeRoute({ order: sort });
    }

}
