import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-shell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-shell.component.html',
  styleUrl: './page-shell.component.scss',
})
export class PageShellComponent {
  @Input() variant: 'default' | 'map' = 'default';
  @Input() withActionBar = false;
  @Input() maxWidth = 440;
}
