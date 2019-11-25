import {
  ChangeDetectorRef,
  Component,
  DoCheck,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Self
} from '@angular/core';

import {FormGroup, NgControl} from '@angular/forms';
import {CountryCode} from './data/country-code';
import {Country} from './model/country.model';
import {ErrorStateMatcher, MatFormFieldControl} from '@angular/material';
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {Subject, Subscription} from 'rxjs';
import {FocusMonitor} from '@angular/cdk/a11y';
import {PhoneNumber, PhoneNumberFormat, PhoneNumberUtil} from 'google-libphonenumber';


const phoneNumberUtil = PhoneNumberUtil.getInstance();

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'ngx-mat-intl-tel-input',
  templateUrl: './ngx-mat-intl-tel-input.component.html',
  styleUrls: ['./ngx-mat-intl-tel-input.component.css'],
  providers: [
    CountryCode,
    {
      provide: MatFormFieldControl,
      useExisting: NgxMatIntlTelInputComponent
    },
  ]
})
export class NgxMatIntlTelInputComponent extends MatFormFieldControl<any> implements OnInit, OnDestroy, DoCheck {
  static nextId = 0;

  @Input()
  preferredCountries: Array<string> = [];

  @Input()
  enablePlaceholder = true;

  @Input()
  enableMask = true;

  @Input()
  cssClass;

  @Input()
  name: string;

  @Input()
  onlyCountries: Array<string> = [];

  @Input()
  enableAutoCountrySelect = false;

  @Input()
  errorStateMatcher: ErrorStateMatcher;

  @Input()
  enableSearch = false;

  @Input()
  controleName: string;

  @Input()
  formGroup: FormGroup;

  stateChanges = new Subject<void>();
  focused = false;
  errorState = false;

  @HostBinding()
  id = `ngx-mat-intl-tel-input-${NgxMatIntlTelInputComponent.nextId++}`;

  describedBy = '';
  phoneNumber = '';
  allCountries: Array<Country> = [];
  preferredCountriesInDropDown: Array<Country> = [];
  selectedCountry: Country;
  numberInstance: PhoneNumber;
  value;
  searchCriteria: string;

  @Output()
  countryChanged: EventEmitter<Country> = new EventEmitter<Country>();

  mask = '';
  maskPrefix = '';

  private subscriptions: Subscription = new Subscription();

  constructor(
    private countryCodeData: CountryCode,
    private fm: FocusMonitor,
    private elRef: ElementRef<HTMLElement>,
    @Optional() @Self() public ngControl: NgControl,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    super();
    this.registerOnFocusMonitor();

    this.fetchCountryData();
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }

    this.registerOnCountryChanged();
  }

  // tslint:disable-next-line:variable-name
  private _placeholder: string;

  @Input()
  get placeholder(): string {
    return this._placeholder;
  }

  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }

  // tslint:disable-next-line:variable-name
  private _required = false;

  @Input()
  get required(): boolean {
    return this._required;
  }

  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  // tslint:disable-next-line:variable-name
  private _disabled = false;

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  get empty() {
    return !this.phoneNumber;
  }

  @HostBinding('class.ngx-floating')
  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  static getPhoneNumberPlaceHolder(countryISOCode: string): string {
    try {
      const example = phoneNumberUtil.getExampleNumber(countryISOCode);
      return phoneNumberUtil.format(example, PhoneNumberFormat.INTERNATIONAL);

    } catch (e) {
      return e;
    }
  }

  getElementRef(): ElementRef<HTMLElement> {
    return this.elRef;
  }

  onTouched = () => {
  }

  propagateChange = (_: any) => {
  }

  ngOnInit() {
    if (this.preferredCountries.length) {
      this.preferredCountries
        .forEach((iso2: string) => {
          const preferredCountry = this.allCountries
            .filter((country: Country) => {
              return country.iso2 === iso2;
            });
          this.preferredCountriesInDropDown.push(preferredCountry[0]);
        });
    }

    if (this.onlyCountries.length) {
      this.allCountries = this.allCountries.filter(c => this.onlyCountries.includes(c.iso2));
    }

    this.selectedCountry = this.allCountries[0];

    if (this.preferredCountriesInDropDown.length) {
      this.selectedCountry = this.preferredCountriesInDropDown[0];
    }

    this.countryChanged.emit(this.selectedCountry);
  }

  ngDoCheck(): void {
    if (this.ngControl) {
      this.errorState = this.ngControl.invalid && this.ngControl.touched;
      this.stateChanges.next();
    }
    this.changeDetectorRef.detectChanges();
  }

  public onPhoneNumberChange(value: string): void {
    try {
      const control = this.formGroup
        .get(this.controleName);

      if (
        value.charAt(2).toString() === '9'
        && this.selectedCountry.iso2 === 'br'
      ) {
        this.mask = ' 00 00000-0000';
      } else {
        this.mask = this.getMaskFromPlaceholder(this.selectedCountry);
      }

      if (this.formGroup && this.controleName) {
        control.setValue(null);
      }

      this.numberInstance = phoneNumberUtil.parse(this._getFullNumber());
      this.value = this.numberInstance.getNationalNumber();
      this.maskPrefix = `+${this.selectedCountry.dialCode}`;

      if (
        this.formGroup
        && this.controleName
      ) {
        const phoneNumber = value ? this.maskPrefix + value : null;
        control.setValue(phoneNumber);
      }

    } catch (e) {
      console.error(e);
      // if no possible numbers are there,
      // then the full number is passed so that validator could be triggered and proper error could be shown
      this.value = this._getFullNumber();
    }
    this.propagateChange(this.value);
  }

  public onCountrySelect(country: Country): void {
    this.selectedCountry = country;
    this.countryChanged.emit(this.selectedCountry);
    this.onPhoneNumberChange('');
  }

  public onInputKeyPress(event): void {
    const pattern = /[0-9+\- ]/;
    if (!pattern.test(event.key)) {
      event.preventDefault();
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  writeValue(value: any): void {
    if (!value) {
      return;
    }

    // this.numberInstance = phoneNumberUtil.parsePhoneNumberFromString(value);

    if (!this.numberInstance) {
      return;
    }

    const countryCode = this.numberInstance.getCountryCode();
    this.phoneNumber = this.numberInstance.getNationalNumber().toString();
    if (!countryCode) {
      return;
    }

    setTimeout(() => {
      this.selectedCountry = this.allCountries.find(c => c.iso2 === countryCode.toString().toLowerCase());
      this.countryChanged.emit(this.selectedCountry);
    }, 1);
  }

  setDescribedByIds(ids: string[]) {
    this.describedBy = ids.join(' ');
  }

  onContainerClick(event: MouseEvent) {
    if ((event.target as Element).tagName.toLowerCase() !== 'input') {
      // tslint:disable-next-line:no-non-null-assertion
      this.elRef.nativeElement.querySelector('input')!.focus();
    }
  }

  ngOnDestroy() {
    this.stateChanges.complete();
    this.fm.stopMonitoring(this.elRef);
  }

  protected fetchCountryData(): void {
    this.countryCodeData
      .allCountries
      .forEach(c => {
        const country: Country = {
          name: c[0].toString(),
          iso2: c[1].toString(),
          dialCode: c[2].toString(),
          priority: +c[3] || 0,
          areaCodes: c[4] as string[] || undefined,
          flagClass: c[1].toString().toUpperCase(),
          placeHolder: ''
        };

        if (this.enablePlaceholder) {
          country.placeHolder = this.getMaskFromPlaceholder(country, false);
        }

        this.maskPrefix = `+${country.dialCode}`;
        if (this.enableMask) {
          this.mask = this.getMaskFromPlaceholder(country);
        }

        this.allCountries.push(country);
      });
  }

  private getMaskFromPlaceholder(country: Country, convertToMask: boolean = true): string {
    const placeholder = NgxMatIntlTelInputComponent.getPhoneNumberPlaceHolder(country.iso2.toUpperCase());
    const placeholderPieces = placeholder.split(' ');
    placeholderPieces.shift();
    placeholderPieces.unshift(' ');
    const joinedPlaceHolderPieces = placeholderPieces.join(' ');

    if (!convertToMask) {
      return joinedPlaceHolderPieces;
    }

    return joinedPlaceHolderPieces.replace(/[0-9]/gmi, '0');
  }

  private registerOnCountryChanged(): void {
    const subscription = this.countryChanged
      .subscribe((country: Country) => {

        if (this.enablePlaceholder) {
          this.placeholder = this.getMaskFromPlaceholder(country, false);
        }

        this.maskPrefix = `+${country.dialCode}`;

        if (this.enableMask) {
          this.mask = this.getMaskFromPlaceholder(country);
        }

        if (
          this.formGroup &&
          this.controleName
        ) {
          this.formGroup
            .get(this.controleName)
            .setValue(this.maskPrefix + this.phoneNumber);
        }

      });
    this.subscriptions.add(subscription);
  }

  private registerOnFocusMonitor(): void {
    const subscription = this.fm
      .monitor(this.elRef, true)
      .subscribe(origin => {

        if (this.focused && !origin) {
          this.onTouched();
        }
        this.focused = !!origin;
        this.stateChanges.next();
      });
    this.subscriptions.add(subscription);
  }

  private _getFullNumber() {
    const val = this.phoneNumber.trim();
    const dialCode = this.selectedCountry.dialCode;
    let prefix;
    const numericVal = val.replace(/\D/g, '');
    // normalized means ensure starts with a 1, so we can match against the full dial code
    const normalizedVal = numericVal.charAt(0) === '1' ? numericVal : '1'.concat(numericVal);
    if (val.charAt(0) !== '+') {
      // when using separateDialCode, it is visible so is effectively part of the typed number
      prefix = '+'.concat(dialCode);
    } else if (val && val.charAt(0) !== '+' && val.charAt(0) !== '1' && dialCode && dialCode.charAt(0) === '1'
      && dialCode.length === 4 && dialCode !== normalizedVal.substr(0, 4)) {
      // ensure national NANP numbers contain the area code
      prefix = dialCode.substr(1);
    } else {
      prefix = '';
    }
    return prefix + numericVal;
  }

}
