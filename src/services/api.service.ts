import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Post } from '../types/post.interface';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private _http = inject(HttpClient);

  getData(limit: number = 8, skip: number = 0) {
    return this._http
      .get<{ posts: Post[] }>(
        `https://dummyjson.com/posts?limit=${limit}&skip=${skip}`
      )
      .pipe(map((data) => data.posts));
  }
}
