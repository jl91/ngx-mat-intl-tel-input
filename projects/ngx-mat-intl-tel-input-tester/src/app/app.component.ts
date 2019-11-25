import {Component, OnInit} from '@angular/core';
import {FormGroup, FormControl, Validators} from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  private phoneForm: FormGroup;

  constructor() {
    this.initForm();
  }

  public ngOnInit(): void {
    this.phoneForm.setValue({
      phone: '+55112222222',
      name: 'name',
      surname: 'surname',
    });
  }

  private initForm(): void {
    this.phoneForm = new FormGroup({
        phone: new FormControl('', [Validators.required]),
        name: new FormControl(undefined, [Validators.required]),
        surname: new FormControl(undefined, [Validators.required])
      }
    );
  }

  onSubmit() {
    console.log('onSubmit', this.phoneForm);
  }
}
