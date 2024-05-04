import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Post } from '../../types/post.interface';
import { ApiService } from '../../services/api.service';
import { delay, filter, finalize } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-container',
  standalone: true,
  imports: [],
  templateUrl: './container.component.html',
  styleUrl: './container.component.css',
  providers: [ApiService],
})
export class ContainerComponent implements OnInit, AfterViewInit {
  private _api = inject(ApiService);

  containerEl = viewChild<ElementRef<HTMLDivElement>>('container');
  items = viewChildren<ElementRef<HTMLDivElement>>('item');

  posts = signal<Post[]>([]);
  isLoading = signal(false);

  containerViewObserver!: IntersectionObserver;

  observedRef?: ElementRef<HTMLDivElement>;

  page = 0;
  private readonly LIMIT = 8;
  readonly MAX_PAGE_TO_LOAD = 3;

  constructor() {
    toObservable(this.posts)
      .pipe(
        delay(500),
        filter((data) => !!data.length)
      )
      .subscribe(() => {
        this._observeItemsVisibility();
      });
  }

  ngOnInit(): void {
    this.isLoading.set(true);
    this._loadData(); // initial loading
  }

  ngAfterViewInit(): void {
    this._initializeObserver();
  }

  private _loadData() {
    this._api
      .getData(this.LIMIT, this.page * this.LIMIT) // getData(limit, skip)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.page = this.page + 1;
        })
      )
      .subscribe((data) => {
        this.posts.update((prev) => [...prev, ...data]);
      });
  }

  private _initializeObserver() {
    const container = this.containerEl()?.nativeElement;
    const options = {
      root: container,
      rootMargin: '0px',
      threshold: 0.5, // Trigger when 50% of the item is visible
    };

    this.containerViewObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this._loadData();
        }
      });
    }, options);
  }

  private _observeItemsVisibility() {
    if (this.observedRef) {
      this.containerViewObserver.unobserve(this.observedRef.nativeElement);
    }
    if (this.page >= this.MAX_PAGE_TO_LOAD) {
      this.containerViewObserver.disconnect();
      return;
    }
    const secondLastItem = this.items().at(-2);
    if (!secondLastItem) return;
    this.observedRef = secondLastItem;
    this.containerViewObserver.observe(secondLastItem?.nativeElement);
  }
}
