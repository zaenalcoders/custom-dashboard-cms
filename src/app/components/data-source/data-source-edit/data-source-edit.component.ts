import { CommonModule, Location } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HttpService } from '../../../services/http.service';
import { LoadingService } from '../../../services/loading.service';
import { FileUploaderComponent } from '../../file-uploader/file-uploader.component';

@Component({
    selector: 'app-data-source-edit',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        FileUploaderComponent
    ],
    templateUrl: './data-source-edit.component.html',
    styleUrl: './data-source-edit.component.scss'
})
export class DataSourceEditComponent implements OnInit {

    constructor(
        private route: ActivatedRoute,
        private http: HttpService,
        private location: Location,
        public loading: LoadingService,
        private el: ElementRef,
        private toastr: ToastrService,
    ) {
        this.route.params.subscribe(e => {
            this.id = e.id;
        });
    }
    private apiPath = 'data-sources';
    id: any;
    @ViewChild('theForm') theForm: NgForm | undefined;
    formGroup!: FormGroup;

    submitForm(form: any): void {
        if (!form.valid) {
            this.el.nativeElement.querySelectorAll('[formcontrolname].ng-invalid')?.[0]?.focus();
            return;
        }
        const { id, name, file } = form.value;
        const fdata = { id, name, file };
        form.disable({ emitEvent: false });
        this.http.Update(this.apiPath + '/update', fdata).then((r: any) => {
            form.enable({ emitEvent: false });
            if (r.success) {
                this.toastr.success('Data saved successfully', 'Success');
                this.back();
            } else {
                if (r.response && r.response.wrong) {
                    Object.keys(r.response.wrong).forEach((key) => {
                        form.get(key)?.setErrors({ serverError: r.response.wrong[key][0] });
                        this.el.nativeElement.querySelectorAll('[formcontrolname="' + key + '"]')?.[0]?.focus();
                    });
                }
            }
        });
    }

    back(): void {
        this.location.back();
    }

    ngOnInit(): void {
        this.http.Get(this.apiPath + '/' + this.id, {}).then((r: any) => {
            if (r.success && r?.response?.result?.data?.id) {
                this.formGroup = new FormGroup({});
                const { id, name, file } = r?.response?.result?.data;
                this.formGroup.addControl('id', new FormControl(id));
                this.formGroup.addControl('name', new FormControl(name));
                this.formGroup.addControl('file', new FormControl(file));
            } else {
                this.back();
            }
        });
    }

}
