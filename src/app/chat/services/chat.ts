import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

export interface ChatMessage {
  id: string;
  from: { role: 'user' | 'bot'; name: string };
  text?: any;
  createdAt: Date;
  cardKind?: 'adaptive';
  adaptiveCard?: any;
  suggestedActions?: any[];
  reactions?: { [emoji: string]: string[] };
  feedback: string;
}

export interface ChatRequest {
  question: string;
  userId: string;
  messageId: string;
  userName: string;
  conversationId: string;   // must be string (your backend expects it)
  questionTimestamp: string;
  interruptResponse?: string;  // optional
  interruptId?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {

  private apiUrl = 'http://150.230.175.171:8100/';

  constructor(private http: HttpClient) { }

  private messages$ = new BehaviorSubject<ChatMessage[]>([]);
  private typing$ = new BehaviorSubject<boolean>(false);

  getMessages() { return this.messages$.asObservable(); }
  getTyping() { return this.typing$.asObservable(); }

  setTyping(value: boolean) {
    this.typing$.next(value);
  }

  addMessage(msg: ChatMessage) {
    this.messages$.next([...this.messages$.getValue(), msg]);
  }

  updateMessage(id: string, updatedFields: Partial<ChatMessage>) {
    const current = this.messages$.getValue();
    const updatedList = current.map(m =>
      m.id === id ? { ...m, ...updatedFields } : m
    );
    this.messages$.next(updatedList);
  }
  simulateBotReply(userText: any) {

    setTimeout(() => {
      this.typing$.next(false);
      this.addMessage({
        id: Date.now().toString(),
        from: { role: 'bot', name: 'Najd | نجد' },
        text: `${userText}`,
        createdAt: new Date(),
        suggestedActions: [],
        feedback: ''
      });
    }, 150);
  }

  sendMessage(payload: ChatRequest): Observable<any> {
    this.typing$.next(true);
    return this.http.post<any>(this.apiUrl + "chat", payload, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  feedback(payload: any): Observable<any> {

    return this.http.post<any>(this.apiUrl + "feedback", payload, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  removeMessage(id: string) {
    const updated = this.messages$.getValue().filter(msg => msg.id !== id);
    this.messages$.next(updated);
  }

}