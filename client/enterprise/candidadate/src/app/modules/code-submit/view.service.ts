import {BehaviorSubject} from 'rxjs';
import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class ViewService {
  private instructionViewActiveSubject = new BehaviorSubject<boolean>(true);
  instructionViewActive$ = this.instructionViewActiveSubject.asObservable();

  setInstructionView(state: boolean) {
    this.instructionViewActiveSubject.next(state);
  }
}
