import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoadingService } from '../../services/loading.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../services/http.service';
import { ToastrService } from 'ngx-toastr';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { Chart, ChartData, Legend, Colors, Tooltip, ArcElement, BarController, CategoryScale, LinearScale, BarElement, DoughnutController, ChartOptions, LineController, PointElement, LineElement } from 'chart.js';
@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
    constructor() {
        Chart.register(
            Colors,
            Legend,
            Tooltip,
            ArcElement,
            BarController,
            CategoryScale,
            LinearScale,
            BarElement,
            DoughnutController,
            LineController,
            PointElement,
            LineElement
        );
    }
    @ViewChild('formModal') formModal: any;
    private apiPath = 'dashboards';
    formGroup: FormGroup = new FormGroup({
        name: new FormControl('', [Validators.required]),
        data_source_id: new FormControl('', [Validators.required]),
        chart_type: new FormControl({ disabled: true }, [Validators.required]),
        chart_size: new FormControl()
    });
    loading = inject(LoadingService);
    modal = inject(NgbModal);
    http = inject(HttpService);
    toastr = inject(ToastrService);
    el = inject(ElementRef);
    dataSources: any[] = [];
    columns: any[] = [];
    private destroy$ = new Subject<void>();
    chartList: any[] = [];
    chartData: any[] = [];
    chartLoading = true;
    formDialog: any = {
        id: null,
        isLoading: false,
        modal: null,
        show: async (data?: any) => {
            if (!this.dataSources.length) {
                await this.getDataSources();
            }
            this.formDialog.id = data.id;
            if (data.id) {
                this.formGroup.get('name')?.setValue(data.name);
                this.formGroup.get('data_source_id')?.setValue(data.data_source_id);
                this.formGroup.get('chart_type')?.setValue(data.chart_type);
                this.formGroup.get('chart_size')?.setValue(data.config?.chart_size);
                this.formGroup.get('x')?.setValue(data.config?.x);
                this.formGroup.get('y')?.setValue(data.config?.y);
                this.formGroup.get('label')?.setValue(data.config?.label);
                this.formGroup.get('value')?.setValue(data.config?.value);
            }
            this.formDialog.modal = this.modal.open(this.formModal, { keyboard: false, backdrop: 'static', centered: true, size: 'lg' });
        },
        submit: () => {
            this.formDialog.isLoading = true;
            if (!this.formGroup.valid) {
                this.el.nativeElement.querySelectorAll('[formcontrolname].ng-invalid')?.[0]?.focus();
                return;
            }
            const fValue = this.formGroup.value;
            const config = { x: fValue?.x, y: fValue?.y, label: fValue?.label, value: fValue?.value, chart_size: fValue?.chart_size };
            const fdata = { ...fValue, config: config };
            this.formGroup.disable({ emitEvent: false });
            this.http.Create(this.apiPath + '/create', fdata).then((r: any) => {
                this.formGroup.enable({ emitEvent: false });
                if (r.success) {
                    this.toastr.success('Data saved successfully', 'Success');
                    this.formDialog.modal.close();
                    this.formGroup.reset();
                } else {
                    if (r.response && r.response.wrong) {
                        Object.keys(r.response.wrong).forEach((key) => {
                            if (key != 'id') {
                                this.formGroup.get(key)?.setErrors({ serverError: r.response.wrong[key][0] });
                                this.el.nativeElement.querySelectorAll('[formcontrolname="' + key + '"]')?.[0]?.focus();
                            }
                        });
                    }
                }
            });
        }
    }

    async getDataSources(): Promise<void> {
        const r = await this.http.Get('data-sources', {});
        this.dataSources = r.response.result.data || [];
    }

    async getList(): Promise<void> {
        this.chartLoading = true;
        const r = await this.http.Get(this.apiPath + '/list', {});
        this.chartList = r.response.result.data || [];

        for (const chart of this.chartList) {
            this.chartData.push(await this.getChart(chart.id));
        }
        setTimeout(() => {
            this.chartData.forEach((data: any) => {
                if (data.chart != undefined) {
                    const el = (<any>document.getElementById(data.item?.id))?.getContext("2d");
                    new Chart(el, {
                        type: 'doughnut',
                        data: data.chart,
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            aspectRatio: 1,
                        }
                    });
                }
            });
            this.chartLoading = false;
        }, 500);
    }

    async getChart(id: string): Promise<any> {
        const r = await this.http.Get(this.apiPath + '/list/' + id, {});
        return r.response.result || {};
    }

    ngOnInit(): void {
        this.getList();
        this.formGroup.get('chart_type')?.valueChanges
            .pipe(
                takeUntil(this.destroy$),
                distinctUntilChanged())
            .subscribe((type: any) => {
                this.formGroup.removeControl('x');
                this.formGroup.removeControl('y');
                this.formGroup.removeControl('y');
                this.formGroup.removeControl('label');
                this.formGroup.removeControl('value');
                if (['bar', 'line'].includes(type)) {
                    this.formGroup.addControl('x', new FormControl(''));
                    this.formGroup.addControl('y', new FormControl(''));
                } else if (['pie', 'doughnut'].includes(type)) {
                    this.formGroup.addControl('label', new FormControl(''));
                    this.formGroup.addControl('value', new FormControl(''));
                }
            });
        this.formGroup.get('data_source_id')?.valueChanges
            .pipe(
                takeUntil(this.destroy$),
                distinctUntilChanged())
            .subscribe((value: any) => {
                const source = this.dataSources.find((i: any) => i.id == value);
                this.columns = source?.columns || [];
                this.formGroup.get('chart_type')?.enable();
                this.formGroup.get('chart_type')?.setValue(null);
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

}
