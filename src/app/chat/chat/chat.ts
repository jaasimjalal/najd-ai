import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, AfterViewChecked, OnDestroy } from '@angular/core';
import { Observable, Subject, take } from 'rxjs';
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
  display_params: DisplayParam[];
  suggestedActions?: string[];
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ImportsModule, MessageList, MessageInput],
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss']
})
export class Chat implements OnInit, AfterViewInit {
  messages$!: Observable<ChatMessage[]>;
  typing$!: Observable<boolean>;
  isLoading = false;
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  private conversationId: string;
  private userId: any
  constructor(private chatService: ChatService, private messageService: MessageService) {

    const storedId = sessionStorage.getItem('conversationId');
    const userid = sessionStorage.getItem('userId');
    if (storedId) {
      this.conversationId = storedId;

    } else {
      this.conversationId = this.generateRandomId();
      sessionStorage.setItem('conversationId', this.conversationId);

    }

    if (userid) {
      this.userId = userid
    } else {
      this.userId = this.generateRandomId()
      sessionStorage.setItem('userId', this.userId);
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
  scrollToBottom(): void {
    if (this.chatContainer?.nativeElement) {
      // Use requestAnimationFrame to ensure DOM has rendered
      requestAnimationFrame(() => {
        const element = this.chatContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      });
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
      userId: this.userId,
      messageId: this.generateRandomId(),
      userName: 'Yasser Alomar',
      conversationId: this.conversationId,
      questionTimestamp: new Date().toISOString()
    };

    // Centralized mappings
            const valueMappings: Record<string, string> = {
              // Leave types
              SAU_ANN: "إجازة سنوية",
              SAU_SICK: "إجازة مرضية",
              SAU_PAT: "إجازة أبوة",
              SAU_MAT: "إجازة أمومة",
              ZEXAM_LV: "إجازة الاختبارات",

              // Attachments
              None: "لا يوجد",

              // Working types
              working_hours: "ساعات العمل",
              overtime: "ساعات إضافية",
            };

    if (id !== "0") {


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
        feedback: ''
      });
    }

    console.log(object)
    this.isLoading = true;
    let suggestedActions: any[] = [];
    if (!object || !object.parameters || object.parameters.tool_name !== "submit_leave_request") {
      this.chatService.sendMessage(payload).subscribe({
        next: (res: any) => {
          let botText: string;

          this.isLoading = false;
          if (typeof res === 'string') {
            console.log('Response is a string ✅:', res);
            botText = res;
          } else if (typeof res === 'object' && res !== null) {
            console.log('Response is an object ✅:', res);

            const obj = res as BotResponse;
            //   suggestedActions = [
            // 'نعم, هذه المعلومات صحيحة'];

            suggestedActions.push({ id: obj.id, label: 'نعم, هذه المعلومات صحيحة', object: obj })



            

            // Name translations (field names)
            const nameMappings: Record<string, string> = {
              attachment: "مرفقات",
              working_type: "نوع العمل",
              date: "التاريخ",
              start_time: "وقت البداية",
              end_time: "وقت النهاية",
              "نوع الإجازة": "نوع الإجازة", // keep as is
            };

            console.log('Display Params:', obj.display_params);

            // Transformation logic
            const extractedJson: BotResponse = {
              id: obj.id ?? '',
              question: obj.question ?? '',
              display_params: Array.isArray(obj.display_params)
                ? obj.display_params
                  // remove "الأداة"
                  .filter((param: DisplayParam) => param.name.trim() !== "الأداة")
                  // translate names and values
                  .map((param: DisplayParam) => {
                    const cleanName = param.name.trim();
                    const cleanValue = param.value.trim();

                    return {
                      name: nameMappings[cleanName] ?? cleanName, // translate field name
                      value: valueMappings[cleanValue] ?? cleanValue, // translate field value
                    };
                  })
                : [],
            };

            console.log('Extracted JSON:', extractedJson);

            botText = this.formatMessage(extractedJson);
          } else {
            console.warn('Response is neither string nor object:', res);
            botText = '';
          }
          this.chatService.setTyping(false);

          // Add bot message
          this.chatService.addMessage({
            id: this.generateRandomId(),
            from: { role: 'bot', name: 'Roaa | رؤى' },
            text: botText,
            createdAt: new Date(),
            suggestedActions,
            feedback: ''
          });

        },
        error: (err: any) => {
          this.chatService.setTyping(false);  // ✅ stop typing
          //  console.error('Error:', err);
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Request Failed',
            detail: 'There is a problem with your request. Please try again.',
            life: 5000 // 5 seconds
          });
          // Remove the failed user message
          this.messages$.pipe(take(1)).subscribe(messages => {
            if (messages.length > 0 && messages[messages.length - 1].from.role == 'user') {
              const lastId = messages[messages.length - 1].id;
              console.log('Last message ID:', lastId);
              console.log(messages[messages.length - 1].from.role)
              this.chatService.removeMessage(lastId);
            }
          });

        }
      });
    } else if (object && object.parameters && object.parameters.tool_name === "submit_leave_request") {
      this.isLoading = true;
      this.chatService.setTyping(true);
      // Extract the dates
      const start = object.parameters.tool_args.date_from;
      const end = object.parameters.tool_args.date_to;
      const leaveTypeKey = object.parameters.tool_args.leave_type; // e.g., "SAU_ANN"

      // Map the leave type key to its display name
      const leaveType = valueMappings[leaveTypeKey] || leaveTypeKey;

      // Construct the dynamic bot message
      const botMessageText = `تم رفع طلب ${leaveType} لك من تاريخ ${start} الى تاريخ ${end} بنجاح`;

      // Construct dynamic bot message
     
      // Delay 10–15 seconds (randomized if you want)
      const delay = Math.floor(Math.random() * (15000 - 10000 + 1)) + 10000; // random between 10000 and 15000 ms

      setTimeout(() => {
        // Hide loading
        this.isLoading = false;
        this.chatService.setTyping(false);

        // Add bot message
        this.chatService.addMessage({
          id: this.generateRandomId(),
          from: { role: 'bot', name: 'Roaa | رؤى' },
          text: botMessageText,
          createdAt: new Date(),
          suggestedActions,
          feedback: ''
        });
      }, delay);
    }

  }

  generateRandomId(): string {
    return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  }

}
