import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ImportsModule } from '../../imports';
import { ChatMessage, ChatService } from '../services/chat';
import { CardRenderer } from '../card-renderer/card-renderer';
import { Observable, take } from 'rxjs';
import { marked } from 'marked';
import { MarkdownModule } from 'ngx-markdown';
import { MessageService } from 'primeng/api';


@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [ImportsModule, CardRenderer, MarkdownModule],
  templateUrl: './message-list.html',
  styleUrl: './message-list.scss'
})
export class MessageList {

  messages$!: Observable<ChatMessage[]>;
  typing$!: Observable<boolean>;
  @Input() messages: ChatMessage[] | null = [];
  @Output() actionSelected = new EventEmitter<{ id: string, label: string, object: any }>();

 
  keys(obj: any) {
    return Object.keys(obj || {});
  }
  @Input() isLoading: boolean = false;
  constructor(private chatService: ChatService,private messageService: MessageService) {

    this.chatService.addMessage({
      id: Date.now().toString(),
      from: { role: 'bot', name: 'Roaa | رؤى' },
      text: marked.parse(`
**مرحبًا!** 🙋‍♀️

أنا **رؤى**، مساعدتك الذكية للموارد البشرية.  
أجيب استفساراتك وأتصرّف نيابةً عنك: أطلب خطابات الموارد البشرية، وأرفع/أعدّل/ألغي الإجازات، وأتابع الموافقات—وكلها من نفس المحادثة.  
قد لا تكون إجاباتي دقيقة دائمًا **100%**، وتفاعلك يساعدني على التحسّن.

 كيف أقدر أساعدك:
- **الطلبات التلقائية:** خطابات تعريف / راتب / بنكي  
- **إدارة الإجازات:** رفع، تعديل، إلغاء، وتتبع الحالة  
- **معرفة السياسات:** أجاوبك من أدلة الشركة ولوائح نظام العمل السعودي مع ذكر المصدر
`) as string,
      suggestedActions: [
        { id: '0', label: 'أبغى خطاب تعريف بالراتب', object: '' },
        { id: '0', label: 'ارفعي إجازة من ٢٥ إلى ٢٨ سبتمبر', object: '' },
        { id: '0', label: 'وش سياسة الترقيات؟ وهل توافق نظام العمل السعودي؟', object: '' }
      ],
      createdAt: new Date(),
      feedback: ''
    });


  }

  ngOnInit() {
    this.messages$ = this.chatService.getMessages();
    this.typing$ = this.chatService.getTyping();


  }

  getTextDirection(text: string): 'rtl' | 'ltr' {
    return /[\u0600-\u06FF]/.test(text) ? 'rtl' : 'ltr';
  }

  onSuggestedActionClick(id: string, label: string, object: any) {
    console.log('Selected Action:', { id, label });

    this.actionSelected.emit({ id, label, object });
    // You can send this back to your service or handle logic here
  }

  tooltipContent: string = `
  <div>
    <strong>Roaa | رؤى<strong><br/>
    <strong>App features:</strong><br/>
    Bots: Complete tasks, find info, and chat using prompts<br/>
    Created by: <a href="#" target="_blank">ELM Company</a><br/><br/>
    <strong>Permissions:</strong>
    <ul>
      <li>Receive messages and data that I provide to it.</li>
      <li>Send me messages and notifications.</li>
      <li>Access profile info such as name, email, company name, and language.</li>
    </ul>
  </div>
`;


  onFeedback(message: ChatMessage, index: number, feedback: 'up' | 'down') {
  if (!this.messages) return;

  const storedId = sessionStorage.getItem('conversationId') || '';

  const userid = sessionStorage.getItem('userId') || '';

  // Toggle feedback: if clicked feedback is same as current, reset to ''
  const newFeedback = message.feedback === feedback ? '' : feedback;

  // Prepare payload
  const payload :any= {
    question: '',
    answer: message.text,
    userId: userid,
    messageId: message.id,
    userName: 'Yasser Alomar',
    conversationId: storedId,
    feedback: newFeedback,
    questionTimestamp: '',
    answerTimestamp: message.createdAt
  };

  // If previous message exists and is from user
  if (index > 0) {
    const prevMessage = this.messages[index - 1];
    if (prevMessage.from.role === 'user') {
      payload.question = prevMessage.text;
      payload.questionTimestamp = prevMessage.createdAt;
    }
  }

  // Send feedback to backend
  this.chatService.feedback(payload).subscribe({
    next: res => {
      console.log('Feedback Response:', res);
      if (res.status === 'success') {
        // Update local message feedback
        this.chatService.updateMessage(message.id, { feedback: newFeedback });
      }
    },
    error: err => console.error('Error sending feedback', err)
  });
}

copyText(text: string) {
  if (!text) return;

  // Strip HTML tags using a temporary element
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = text;
  const plainText = tempDiv.textContent || tempDiv.innerText || '';

  // Copy plain text to clipboard
  navigator.clipboard.writeText(plainText).then(
    () => {
      console.log('Text copied to clipboard:', plainText);
      // Optional: show toast
      this.messageService.add({ 
        severity: 'success', 
        summary: 'Copied', 
        detail: 'Message copied to clipboard', 
        life: 2000 
      });
    },
    err => {
      console.error('Failed to copy text: ', err);
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Copy failed', 
        detail: 'Could not copy text', 
        life: 2000 
      });
    }
  );
}




}
