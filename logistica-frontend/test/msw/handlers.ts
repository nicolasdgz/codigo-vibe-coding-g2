import { http, HttpResponse } from 'msw'

export const handlers: Parameters<typeof import('msw/node').setupServer>[0][] = []
