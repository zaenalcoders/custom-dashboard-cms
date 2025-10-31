import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpService } from '../../services/http.service';
import { CommonModule } from '@angular/common';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-file-uploader',
    templateUrl: './file-uploader.component.html',
    styleUrl: './file-uploader.component.scss',
    standalone: true,
    imports: [
        CommonModule,
        NgbTooltip
    ]
})
export class FileUploaderComponent implements AfterViewInit {
    constructor(private http: HttpService, private cdr: ChangeDetectorRef) { }

    @ViewChild('inputFile') inputFile!: ElementRef;
    @Input() isViewOnly: boolean = false;
    @Input() isDisabled: boolean | null = false;
    @Input() isInvalid: boolean | undefined = false;
    @Input() elementClass: string = '';
    @Input() fileType!: string;
    @Input() elementType: 'input' | 'div' | 'button' = 'div';
    @Input() buttonName: string = 'Upload';
    @Input() clearOnSuccess: boolean = false;
    @Input() elementHeight: string = '220px';
    @Input() elementWidth: string = '100%';
    @Input() maxSize: number = 0;
    @Input() imgMinWidth: number = 0;
    @Input() imgMinHeight: number = 0;
    @Input() imgMinAspectRatio: number = 0;
    @Input() imgMaxAspectRatio: number = 0;
    @Input() directUpload: boolean = true;
    @Input() multiple: boolean = false;
    @Input() initialFileName: any;
    @Output() response = new EventEmitter<any>();
    errorMessage: any;
    isLoading: boolean = false;
    isImage: boolean = false;
    fileName: any;
    assetUrl = environment.assetUrl;
    apiPath = 'file-uploader';
    inputEvent: any;

    async handle(ev: any): Promise<void> {
        this.inputEvent = ev;
        this.errorMessage = null;
        this.isLoading = true;
        if (!ev.target?.files?.length) {
            ev.target.value = '';
            this.isLoading = false;
            return;
        }
        const parseFile = (file: any): any => {
            this.isImage = false;
            return new Promise((resolve: any) => {
                const allowedFileType = this.fileType.split(',');
                if (allowedFileType.indexOf(file?.type) < 0) {
                    ev.target.value = '';
                    this.isLoading = false;
                    this.errorMessage = `File type not allowed, only ${this.fileType}`;
                    resolve(false);
                    return;
                }
                var mbSize = parseFloat((file.size / (1024 * 1024)).toFixed(2));
                if (this.maxSize && (mbSize > this.maxSize)) {
                    ev.target.value = '';
                    this.isLoading = false;
                    this.errorMessage = `File size not allowed, max. ${this.maxSize}MB`
                    resolve(false);
                    return;
                }
                if (file?.type && (file.type).toString().substr(0, 5) === 'image') {
                    this.isImage = true;
                    const checkDimension = (e: any) => {
                        const img = new Image();
                        img.onload = () => {
                            const maxRes = img.width >= (this.imgMinWidth || 0) && img.height >= (this.imgMinHeight || 0);
                            const maxRatio = (img.width / img.height >= (this.imgMinAspectRatio || 0)) && (img.width / img.height <= (this.imgMaxAspectRatio || 0));
                            if (!maxRes && !maxRatio) {
                                ev.target.value = '';
                                this.isLoading = false;
                                this.errorMessage = `Image resolution not allowed`;
                                img.remove();
                                resolve(false);
                            } else {
                                img.remove();
                                resolve(true);
                            }
                        };
                        img.onerror = () => {
                            ev.target.value = '';
                            this.isLoading = false;
                            this.errorMessage = `Failed to load image`;
                            img.remove();
                            resolve(false);
                        };
                        img.src = e;
                    };
                    const fReader = new FileReader();
                    fReader.onloadend = (e) => {
                        const src = e.target?.result as string;
                        if ((this.imgMinWidth > 0 && this.imgMinHeight > 0) || (this.imgMinAspectRatio > 0 && this.imgMaxAspectRatio > 0)) {
                            checkDimension(src);
                        } else {
                            resolve(true);
                        }
                    };
                    fReader.onerror = () => {
                        ev.target.value = '';
                        this.isLoading = false;
                        this.errorMessage = 'Failed to read file';
                        resolve(false);
                    };
                    fReader.readAsDataURL(file);
                } else {
                    this.isImage = false;
                    this.fileName = ((file.name).length > 15 ? (file.name).substr(0, 5) + '...' + (file.name).substr((file.name).length - 10) : file.name);
                    this.isLoading = false;
                    resolve(true);
                }
            });
        };
        if (!this.multiple) {
            const file = ev?.target?.files[0];
            const e = await parseFile(file);
            if (!e) {
                ev.target.value = '';
                return;
            }
            const fdata = new FormData();
            fdata.append('file', file);
            fdata.append('mime_type', this.fileType);
            if (this.fileName) {
                fdata.append('old_file', this.fileName);
            }
            const r = await this.http.Upload(this.apiPath + '/create', fdata);
            this.isLoading = false;
            if (r.success) {
                this.fileName = r.response.result;
                this.response.emit(this.fileName);
                if (this.clearOnSuccess) {
                    ev.target.value = '';
                }
            } else {
                ev.target.value = '';
            }
        } else {
            const files = ev?.target?.files || [];
            const uploadedFiles: any = [];
            for (let file of files) {
                const e = await parseFile(file);
                if (!e) {
                    return;
                }
                const fdata = new FormData();
                fdata.append('file', file);
                fdata.append('mime_type', this.fileType);
                const r = await this.http.Upload(this.apiPath + '/create', fdata);
                if (r.success) {
                    uploadedFiles.push(r.response.result);
                }
            }
            this.isLoading = false;
            this.fileName = uploadedFiles[0];
            this.response.emit(uploadedFiles);
        }
    }

    deleteFile(): void {
        this.isLoading = true;
        this.http.Delete(this.apiPath + '/delete', [this.fileName]).then((r: any) => {
            this.isLoading = false;
            if (r.success) {
                this.isImage = false;
                this.fileName = null;
                this.response.emit(null);
                this.inputEvent.target.value = '';
            }
        });
    }

    isImageFile(fileName: string): boolean {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg', '.ico'];
        return imageExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
    }

    browseFile(): void {
        if (this.isLoading || this.isViewOnly) {
            return;
        }
        this.inputFile.nativeElement.click();
    }

    viewFile() {
        const url = environment.assetUrl + this.fileName;
        window.open(url);
    }

    async ngAfterViewInit(): Promise<void> {
        if (this.initialFileName) {
            this.fileName = this.initialFileName;
            this.isImage = this.isImageFile(this.fileName);
        }

        this.cdr.detectChanges();
    }
}
