import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HttpService } from '../../../services/http.service';
import { LoadingService } from '../../../services/loading.service';
import { NgbModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FileUploaderComponent } from "../../file-uploader/file-uploader.component";

@Component({
    selector: 'app-data-source-detail',
    standalone: true,
    imports: [
        CommonModule,
        FileUploaderComponent,
        NgbTooltip,
        RouterLink
    ],
    templateUrl: './data-source-detail.component.html',
    styleUrl: './data-source-detail.component.scss'
})
export class DataSourceDetailComponent implements OnInit {
    constructor(
        private http: HttpService,
        public loading: LoadingService,
        private route: ActivatedRoute,
        private toastr: ToastrService,
        private location: Location,
        private modalService: NgbModal
    ) {
        this.route.params.subscribe(e => {
            this.id = e.id;
        });
    }
    @ViewChild('deleteModal') deleteModal: any;
    private apiPath = 'data-sources';
    private id: any = null;
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
            this.http.Delete(this.apiPath + '/delete', this.deleteDialog.ids).then((r: any) => {
                this.deleteDialog.isDeleting = false;
                if (r.success) {
                    this.back();
                    this.toastr.success('Data deleted successfully', 'Success');
                }
            });
        }
    }

    back(): void {
        this.location.back();
    }

    getData(): void {
        this.http.Get(this.apiPath + '/' + this.id, {}).then((r: any) => {
            if (r.success && r?.response?.result?.data?.id) {
                this.data = r?.response?.result?.data;
                this.permission = r?.permission || {};
            } else {
                this.toastr.error('Data not found');
                this.back();
            }
        });
    }

    ngOnInit(): void {
        this.getData();
    }

}
