import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoadingService } from '../../services/loading.service';
import { NgbModal, NgbDropdownMenu, NgbDropdown, NgbDropdownToggle } from '@ng-bootstrap/ng-bootstrap';
import { NgLabelTemplateDirective, NgOptionTemplateDirective, NgSelectComponent, NgOptionComponent } from '@ng-select/ng-select';
import { HttpService } from '../../services/http.service';
import { ToastrService } from 'ngx-toastr';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { Chart, Legend, Colors, Tooltip, ArcElement, BarController, CategoryScale, LinearScale, BarElement, DoughnutController, LineController, PointElement, LineElement, PieController, plugins } from 'chart.js';
@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NgbDropdownMenu,
        NgbDropdown,
        NgbDropdownToggle,
        NgSelectComponent,
        NgOptionComponent
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
            LineElement,
            PieController,
            BarController,
            CategoryScale,
            LinearScale,
            BarElement,
            PointElement,
            LineElement,
            PieController
        );
    }
    @ViewChild('formModal') formModal: any;
    @ViewChild('deleteModal') deleteModal: any;
    private apiPath = 'dashboards';
    formGroup: FormGroup = new FormGroup({
        name: new FormControl(null, [Validators.required]),
        data_source_id: new FormControl(null, [Validators.required]),
        chart_type: new FormControl({ value: null, disabled: true }, [Validators.required]),
        chart_size: new FormControl(),
        limit: new FormControl(),
    });
    chartTypes = ['bar', 'line', 'pie', 'doughnut'];
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
    tableData: any[] = [];
    chartLoading = true;
    singleChartLoading: any = [];
    modalLoading = false;
    formDialog: any = {
        id: null,
        data: {},
        isLoading: false,
        modal: null,
        show: async (data?: any) => {
            if (!this.dataSources.length) {
                await this.getDataSources();
            }
            this.formDialog.data = data;
            this.formDialog.id = data?.id;
            if (data?.id) {
                this.formGroup.get('name')?.setValue(data.name);
                this.formGroup.get('data_source_id')?.setValue(data.data_source_id);
                this.formGroup.get('chart_type')?.setValue(data.chart_type);
                this.formGroup.get('chart_size')?.setValue(data.config?.chart_size);
                this.formGroup.get('x')?.setValue(data.config?.x);
                this.formGroup.get('y')?.setValue(data.config?.y);
                this.formGroup.get('label')?.setValue(data.config?.label);
                this.formGroup.get('value')?.setValue(data.config?.value);
                this.formGroup.get('columns')?.setValue(data.config?.columns);
                this.formGroup.get('sort')?.setValue(data.config?.sort);
                this.formGroup.get('limit')?.setValue(data.config?.limit);
                this.formGroup.get('group_by')?.setValue(data.config?.group_by);
            }
            this.formDialog.modal = this.modal.open(this.formModal, { keyboard: false, backdrop: 'static', centered: true, size: 'lg' });
        },
        submit: async () => {
            this.formDialog.isLoading = true;
            if (!this.formGroup.valid) {
                this.el.nativeElement.querySelectorAll('[formcontrolname].ng-invalid')?.[0]?.focus();
                return;
            }
            const fValue = this.formGroup.value;
            const config = {
                x: fValue?.x,
                y: fValue?.y,
                label: fValue?.label,
                value: fValue?.value,
                chart_size: fValue?.chart_size,
                columns: fValue?.columns,
                sort: fValue?.sort,
                limit: fValue?.limit,
                group_by: fValue?.group_by
            };
            const fdata = { ...fValue, config: config, ...{ id: this.formDialog?.id } };
            this.formGroup.disable({ emitEvent: false });
            const postType = this.formDialog.id ? 'update' : 'create';
            let r;
            if (postType == 'update') {
                r = await this.http.Update(this.apiPath + '/update', fdata, true);
            } else {
                r = await this.http.Create(this.apiPath + '/create', fdata, true);
            }
            this.formGroup.enable({ emitEvent: false });
            if (r.success) {
                if (this.formDialog.id) {
                    this.formDialog.data.loading = true;
                }
                this.toastr.success('Data saved successfully', 'Success');
                this.formDialog.close();
                this.getList(r.response?.result?.id);
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
        },
        close: () => {
            this.formDialog.modal.close();
            this.formGroup.reset();
        }
    }

    deleteDialog: any = {
        ids: [],
        isDeleting: false,
        modal: null,
        show: (id: any) => {
            this.deleteDialog.id = id;
            this.deleteDialog.modal = this.modal.open(this.deleteModal, { keyboard: false, backdrop: 'static', centered: true });
        },
        submit: () => {
            this.deleteDialog.isDeleting = true;
            this.http.Delete(this.apiPath + '/delete', [this.deleteDialog.id]).then((r: any) => {
                this.deleteDialog.isDeleting = false;
                if (r.success) {
                    this.toastr.success('Data deleted successfully', 'Success');
                    const idx = this.chartList.findIndex((i: any) => i.id == this.deleteDialog.id);
                    if (idx >= 0) {
                        this.chartList.splice(idx, 1);
                    }
                    this.deleteDialog.modal.close();
                }
            });
        }
    }

    async getDataSources(): Promise<void> {
        this.modalLoading = true;
        const r = await this.http.Get('data-sources', {}, true);
        this.dataSources = r.response.result.data || [];
        this.modalLoading = false;
    }

    private timeout(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async getList(id?: string | null): Promise<void> {
        const r = await this.http.Get(this.apiPath + '/list' + (id ? '/' + id : ''), {}, (id != null));
        if (id) {
            const idx = this.chartList.findIndex((i: any) => i.id == id);
            let chart;
            if (idx >= 0) {
                this.chartList[idx] = r.response.result.data;
                chart = this.chartList[idx];
                chart.loading = true;
            } else {
                this.chartList.unshift(r.response.result.data);
                chart = this.chartList[0];
                chart.loading = true;
            }

            await this.getChart(chart);
            await this.timeout(500);
            chart.loading = false;

            return;
        } else {
            this.chartList = r.response.result.data || [];
        }
        for (const chart of this.chartList) {
            chart.loading = true;
            await this.getChart(chart);
            await this.timeout(500);
            chart.loading = false;
        }
    }

    async getChart(chart: any): Promise<any> {
        const r = await this.http.Get(this.apiPath + '/chart/' + chart.id, {}, true);
        const chartData = r.response.result || {};
        if (chartData.chart != undefined) {
            const el = (<any>document.getElementById(chartData.item?.id))?.getContext("2d");
            el.clearRect(0, 0, el.width, el.height);

            // return;
            let displayLegend = false;
            if (['pie', 'doughnut'].includes(chartData.item?.chart_type)) {
                displayLegend = true;
            } else if (chartData.item?.config?.group_by) {
                displayLegend = true;
            }
            if (chart._chart) {
                chart._chart.destroy();
            }
            chart._chart = new Chart(el, {
                type: chartData.item?.chart_type,
                data: chartData.chart,
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 1,
                    plugins: {
                        legend: {
                            display: displayLegend
                        }
                    }
                }
            });
        } else {
            const tbody = document.getElementById(chartData.item?.id) as HTMLTableSectionElement;
            tbody.innerHTML = '';
            chartData.records.forEach((record: any) => {
                const tr = document.createElement("tr");
                const tdKategori = document.createElement("td");
                tdKategori.textContent = record.kategori;
                const tdTotal = document.createElement("td");
                tdTotal.textContent = record.total.toString();
                tr.appendChild(tdKategori);
                tr.appendChild(tdTotal);
                tbody.appendChild(tr);

            });
        }
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
                this.formGroup.removeControl('group_by');
                this.formGroup.removeControl('label');
                this.formGroup.removeControl('value');
                this.formGroup.removeControl('columns');
                this.formGroup.removeControl('sort');
                if (['bar', 'line'].includes(type)) {
                    this.formGroup.addControl('x', new FormControl());
                    this.formGroup.addControl('y', new FormControl());
                    this.formGroup.addControl('group_by', new FormControl());
                } else if (['pie', 'doughnut'].includes(type)) {
                    this.formGroup.addControl('label', new FormControl());
                    this.formGroup.addControl('value', new FormControl());
                } else if (type == 'table') {
                    this.formGroup.addControl('columns', new FormControl([]));
                    this.formGroup.addControl('sort', new FormControl({ value: null, disabled: true }));
                    this.formGroup.get('columns')?.valueChanges
                        .pipe(
                            takeUntil(this.destroy$),
                            distinctUntilChanged())
                        .subscribe((value: any) => {
                            this.formGroup.get('sort')?.setValue(null);
                            if (!value?.length) {
                                this.formGroup.get('sort')?.disable();
                            } else {
                                this.formGroup.get('sort')?.enable();
                            }
                        });
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
