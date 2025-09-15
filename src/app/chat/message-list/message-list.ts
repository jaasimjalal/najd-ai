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

  constructor(private chatService: ChatService,private messageService: MessageService) {

    this.chatService.addMessage({
      id: Date.now().toString(),
      from: { role: 'bot', name: 'Najd | نجد' },
      text: marked.parse(` **مرحبًا**  !🙋‍♀️

أنا **نجد**، مساعدتك الافتراضية في مجموعة التخطيط والتمكين المؤسسي.  
أنا هنا لمساعدتك في الإجابة على استفساراتك المتعلقة بمجموعة التخطيط والتمكين المؤسسي. قد لا تكون إجاباتي دقيقة بنسبة 100% دائمًا،  
**تفاعلك معي يساعدني على التعلم والتحسن باستمرار**.

هذه هي النسخة الأولى مني، ومع مرور الوقت سوف أتأقلم على وظيفتي الجديدة وأتعلم ويتحسن أدائي.

**أحد نقاط قوتي:**  
أستطيع توصيل صوتك ومقترحاتك مع الإدارة المعنية.  
عندك اقتراح؟ بس اكتب  **\`/اقتراح\`**  وأرسله لي، وما عليك، أزهلها والباقي عندي، بوصلها **بسرية تامة**، ولا تشيل هم.

 **شكرًا لاستخدامك لي، وأتطلع إلى مساعدتك**  !😊
 
 يقولون عند نجد تجد الإجابة، جرب تسألني شيء مثل كذا
 :`) as string,
      suggestedActions: [
        { id: '0', label: 'وش هي ثقافة علم؟', object: '' },
        { id: '0', label: 'من هي نجد؟', object: '' },
        { id: '0', label: 'كيف أرفع اجازة؟', object: '' },
        { id: '0', label: 'ماهي سياسة الترقيات؟', object: '' },
        { id: '0', label: 'ماهي معايير قبول طلب التدريب؟', object: '' },
        { id: '0', label: '/اقتراح', object: '' }
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
    <strong>Najd | نجد</strong><br/>
    الموظفة الذكية لقطاع رأس المال البشري، دائمًا هنا لمساعدتك!<br/><br/>
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

  // Toggle feedback: if clicked feedback is same as current, reset to ''
  const newFeedback = message.feedback === feedback ? '' : feedback;

  // Prepare payload
  const payload :any= {
    question: '',
    answer: message.text,
    userId: '1',
    messageId: message.id,
    userName: 'Jaasim',
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
