import { Routes } from '@angular/router';
import {AppComponent} from './app.component';
import {CodeSubmitComponent} from './modules/code-submit/code-submit.component';

export const routes: Routes = [
  { path: '', component: AppComponent},
  { path: 'code-submit', component: CodeSubmitComponent},
];
