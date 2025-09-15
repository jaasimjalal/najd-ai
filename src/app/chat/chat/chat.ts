import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Observable, take } from 'rxjs';
import { ImportsModule } from '../../imports';
import { ChatService, ChatMessage, ChatRequest } from '../services/chat';
import { MessageList } from '../message-list/message-list';
import { MessageInput } from '../message-input/message-input';
import { MessageService } from 'primeng/api';

interface DisplayParam {
  name: string;
  value: string;
}

interface BotResponse {
  id?: string;
  question?: string;
  display_params?: DisplayParam[];
  suggestedActions?: string[];
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ImportsModule, MessageList, MessageInput],
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss']
})
export class Chat implements OnInit , AfterViewInit {
  messages$!: Observable<ChatMessage[]>;
  typing$!: Observable<boolean>;

  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  private conversationId: string;
  constructor(private chatService: ChatService, private messageService: MessageService) {

    const storedId = sessionStorage.getItem('conversationId');
    if (storedId) {
      this.conversationId = storedId;
    } else {
      this.conversationId = this.generateRandomId();
      sessionStorage.setItem('conversationId', this.conversationId);
    }
   }

  ngOnInit() {
    this.messages$ = this.chatService.getMessages();
    this.typing$ = this.chatService.getTyping();
  }

  ngAfterViewInit() {
    // Scroll to bottom on new messages
    this.messages$.subscribe(() => {
      setTimeout(() => this.scrollToBottom(), 50);
    });
  }

  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  // Detect RTL/LTR
  getTextDirection(text: string): string {
    const containsArabic = /[\u0600-\u06FF]/.test(text);
    return containsArabic ? 'rtl' : 'ltr';
  }

  formatMessage(obj: BotResponse | string | undefined): string {
    if (!obj) return '';

    if (typeof obj === 'string') return obj;

    let md = '';

    // Question as bold
    if (obj.question) {
      md += `**${obj.question}**\n\n`;
    }

    // Display params as markdown table
    if (obj.display_params?.length) {
      md += `**تفاصيل الطلب:**\n\n`;

      // Header row
      md += `| الاسم | القيمة |\n`;
      md += `| --- | --- |\n`;

      obj.display_params.forEach(param => {
        md += `| ${param.name} | ${param.value} |\n`;
      });

      md += `\n`;
    }

    // Suggested actions (as list)
    if (obj.suggestedActions?.length) {
      md += `**الخيارات المقترحة:**\n`;
      obj.suggestedActions.forEach(action => {
        md += `- ${action}\n`;
      });
      md += `\n`;
    }

    return md;
  }

  handleAction(event: { id: string, label: string, object: any }) {
    const { id, label, object } = event;

    this.onSendMessage(id, label, object);
  }

  onSendMessage(id: string, text: string, object: any) {
    if (!text.trim()) return;

    
    const payload: ChatRequest = {
      question: text,
      userId: '1',
      messageId: this.generateRandomId(),
      userName: 'Yasser Alomar',
      conversationId: this.conversationId,
      questionTimestamp: new Date().toISOString()
    };

    if (id !== "0") {

      console.log(object.parameters.tool_name)
      payload.question = object.parameters.tool_name
      payload.interruptResponse = 'yes';
      payload.interruptId = id;
    } else {
      // Add user message
      this.chatService.addMessage({
        id: payload.messageId,
        from: { role: 'user', name: 'You' },
        text,
        createdAt: new Date(),
        feedback:''
      });
    }



    this.chatService.sendMessage(payload).subscribe({
      next: (res: any) => {
        let botText: string;
        let suggestedActions: any[] = [];

        if (typeof res === 'string') {
          console.log('Response is a string ✅:', res);
          botText = res;
        } else if (typeof res === 'object' && res !== null) {
          console.log('Response is an object ✅:', res);

          const obj = res as BotResponse;
          //   suggestedActions = [
          // 'نعم, هذه المعلومات صحيحة'];

          suggestedActions.push({ id: obj.id, label: 'نعم, هذه المعلومات صحيحة', object: obj })



          // Extract needed fields
          const extractedJson: BotResponse = {
            id: obj.id || '',
            question: obj.question || '',
            display_params: obj.display_params || [],
          };

          botText = this.formatMessage(extractedJson);
        } else {
          console.warn('Response is neither string nor object:', res);
          botText = '';
        }
        this.chatService.setTyping(false);

        // Add bot message
        this.chatService.addMessage({
          id: this.generateRandomId(),
          from: { role: 'bot', name: 'Najd | نجد' },
          text: botText,
          createdAt: new Date(),
          suggestedActions,
          feedback:''
        });

      },
      error: (err: any) => {
        this.chatService.setTyping(false);  // ✅ stop typing
        //  console.error('Error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Request Failed',
          detail: 'There is a problem with your request. Please try again.',
          life: 5000 // 5 seconds
        });
        // Remove the failed user message
        this.messages$.pipe(take(1)).subscribe(messages => {
          if (messages.length > 0 && messages[messages.length - 1].from.role=='user') {
            const lastId = messages[messages.length - 1].id;
            console.log('Last message ID:', lastId);
            console.log(messages[messages.length - 1].from.role)
            this.chatService.removeMessage(lastId);
          }
        });
        
      }
    });
  }

  generateRandomId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}
}
