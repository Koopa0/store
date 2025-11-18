/**
 * 底部資訊元件
 * Footer Component
 *
 * 應用程式的底部資訊列
 * Application's footer information bar
 *
 * 教學重點 / Teaching Points:
 * 1. 簡潔的底部設計
 * 2. 版權資訊顯示
 * 3. 社交媒體連結
 * 4. 響應式佈局
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

// ngx-translate
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  /**
   * 當前年份
   * Current year
   */
  currentYear = new Date().getFullYear();

  /**
   * 底部連結
   * Footer links
   */
  footerLinks = {
    company: [
      { label: 'footer.about', path: '/about' },
      { label: 'footer.contact', path: '/contact' },
      { label: 'footer.careers', path: '/careers' },
    ],
    support: [
      { label: 'footer.help_center', path: '/help' },
      { label: 'footer.shipping', path: '/shipping' },
      { label: 'footer.returns', path: '/returns' },
      { label: 'footer.faq', path: '/faq' },
    ],
    legal: [
      { label: 'footer.privacy', path: '/privacy' },
      { label: 'footer.terms', path: '/terms' },
      { label: 'footer.cookies', path: '/cookies' },
    ],
  };

  /**
   * 社交媒體連結
   * Social media links
   *
   * 注意：Material Icons 沒有社交媒體的官方圖標
   * 使用通用圖標作為替代方案
   */
  socialLinks = [
    {
      name: 'Facebook',
      icon: 'thumb_up', // 使用 Material Icons 的替代圖標
      url: 'https://facebook.com',
      color: '#1877F2',
    },
    {
      name: 'Instagram',
      icon: 'photo_camera',
      url: 'https://instagram.com',
      color: '#E4405F',
    },
    {
      name: 'Twitter',
      icon: 'chat_bubble',
      url: 'https://twitter.com',
      color: '#1DA1F2',
    },
    {
      name: 'YouTube',
      icon: 'play_circle',
      url: 'https://youtube.com',
      color: '#FF0000',
    },
  ];

  /**
   * 開啟社交媒體連結
   * Open social media link
   */
  openSocialLink(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
