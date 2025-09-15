import { Component, Input } from '@angular/core';
import { ImportsModule } from '../../imports';

@Component({
  selector: 'app-card-renderer',
  standalone: true,
    imports:[ImportsModule],
  templateUrl: './card-renderer.html',
  styleUrl: './card-renderer.scss'
})
export class CardRenderer {
@Input() card: any;

handleAction(action: any) {
  if(action.type === 'Action.OpenUrl') {
    window.open(action.url, '_blank');
  } else {
    console.log('Action clicked:', action);
  }
}
}
