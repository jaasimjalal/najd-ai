import { Component } from '@angular/core';
import { ImportsModule } from '../imports';
import { Chat } from '../chat/chat/chat';

@Component({
  selector: 'app-layout',
  standalone: true,
    imports:[ImportsModule,Chat],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class Layout {
userName = 'Yasser Alomar';
selectedButton: string = 'najd';

selectButton(button: string) {
  if(button=="najd"){
    this.selectedButton = button;
  }
}

}
