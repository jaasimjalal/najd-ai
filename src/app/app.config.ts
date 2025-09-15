import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura'; 
import { routes } from './app.routes';
import { ChartModule } from 'primeng/chart';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
import { MarkdownModule } from 'ngx-markdown';
import { MessageService } from 'primeng/api';

registerLocaleData(localeAr);  // ✅ enable Arabic locale

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    MessageService,
     importProvidersFrom(ChartModule),
     importProvidersFrom(MarkdownModule.forRoot({ loader: HttpClient })), 
     provideHttpClient(),
     provideAnimationsAsync(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
     { provide: LOCALE_ID, useValue: 'ar'},
        providePrimeNG({
 
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false || 'none'
        }
      },
    })
  ]
};
