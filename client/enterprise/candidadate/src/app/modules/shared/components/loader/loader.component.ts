import {Component} from "@angular/core";
import {NgIf} from "@angular/common";

@Component({
    selector: 'app-loader',
    imports: [
        NgIf
    ],
    templateUrl: './loader.component.html',
    styleUrl: './loader.component.css'
})
export class LoaderComponent {
    isLoading = false;

    showLoader(loading:boolean) {
        this.isLoading = loading;
    }
}
