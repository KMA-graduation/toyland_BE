import { ResponseCodeEnum } from '@enums/response-code.enum';

export interface ResponsePayload<T> {
  statusCode: ResponseCodeEnum;
  message?: string;
  data?: T;
  meta?: unknown;
  type?: string;
  __debug__?: unknown;
}
