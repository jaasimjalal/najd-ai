import { Component, EventEmitter, Output } from '@angular/core';
import { ImportsModule } from '../../imports';

@Component({
  selector: 'app-message-input',
  standalone: true,
    imports:[ImportsModule],
  templateUrl: './message-input.html',
  styleUrl: './message-input.scss'
})
export class MessageInput {
  value: string = '';
  showEditor: boolean = false;

  @Output() send = new EventEmitter<string>();  // ✅ emit to parent

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey && !this.showEditor) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  toggleEditor() {
    this.showEditor = !this.showEditor;
  }

 onEditorChange(event: any) {
  // Get plain text by creating a temporary div
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = event.htmlValue;
  this.value = tempDiv.innerText;
}

  onFileClick() {
    console.log('File upload clicked');
  }

  sendMessage() {
    if (this.value.trim()) {
      this.send.emit(this.value);       // ✅ emit the message
      console.log('Message Sent:', this.value);
      this.value = '';
      if (this.showEditor) {
        this.showEditor = false;        // return to textarea after send
      }
    }
  }
}
