import { http, HttpResponse } from 'msw'

// Mock Supabase REST/Storage here. Expand per TESTING.md as the data layer lands.
export const handlers = [
  http.get('*/rest/v1/trips', () => HttpResponse.json([])),
]
