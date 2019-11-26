import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgxMatIntlTelInputComponent} from './ngx-mat-intl-tel-input.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import {SearchPipe} from './search.pipe';
import {NgxMaskModule} from 'ngx-mask';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatMenuModule,
    MatButtonModule,
    MatDividerModule,
    ReactiveFormsModule,
    NgxMaskModule.forRoot({})
  ],
  declarations: [
    NgxMatIntlTelInputComponent,
    SearchPipe,
  ],
  exports: [
    NgxMatIntlTelInputComponent
  ]
})
export class NgxMatIntlTelInputModule {
}
