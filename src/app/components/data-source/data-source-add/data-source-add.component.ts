import { CommonModule, Location } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { HttpService } from '../../../services/http.service';
import { LoadingService } from '../../../services/loading.service';
import { FileUploaderComponent } from '../../file-uploader/file-uploader.component';

@Component({
    selector: 'app-data-source-add',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        FileUploaderComponent
    ],
    templateUrl: './data-source-add.component.html',
    styleUrl: './data-source-add.component.scss'
})
export class DataSourceAddComponent implements OnInit {
    constructor(
        private http: HttpService,
        private el: ElementRef,
        private location: Location,
        public loading: LoadingService,
        private toastr: ToastrService
    ) { }
    @ViewChild('theForm') theForm: NgForm | undefined;
    private apiPath = 'data-sources';
    stayPage: boolean = false;
    formGroup = new FormGroup({
        name: new FormControl(),
        file: new FormControl(),
    });

    submitForm(form: any): void {
        if (!form.valid) {
            this.el.nativeElement.querySelectorAll('[formcontrolname].ng-invalid')?.[0]?.focus();
            return;
        }
        const fdata = form.value;
        form.disable({ emitEvent: false });
        this.http.Create(this.apiPath + '/create', fdata).then((r: any) => {
            form.enable({ emitEvent: false });
            if (r.success) {
                this.toastr.success('Data saved successfully', 'Success');
                this.back();
            } else {
                if (r.response && r.response.wrong) {
                    Object.keys(r.response.wrong).forEach((key) => {
                        if (key != 'id') {
                            form.get(key)?.setErrors({ serverError: r.response.wrong[key][0] });
                            this.el.nativeElement.querySelectorAll('[formcontrolname="' + key + '"]')?.[0]?.focus();
                        }
                    });
                }
            }
        });
    }

    back(): void {
        this.location.back();
    }

    ngOnInit(): void {
        //
    }

}
