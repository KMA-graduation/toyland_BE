import { ResponseCodeEnum } from '@enums/response-code.enum';
import { ResponseMessageEnum } from '@enums/response-message.enum';
import { ResponseBuilder } from './response-builder';
import { ResponsePayload } from './response-payload';

export class ApiError extends Error {
  private readonly _errorCode: ResponseCodeEnum;

  private readonly _message: string;

  // private _debug: unknown;

  constructor(errorCode: ResponseCodeEnum, message?: ResponseMessageEnum) {
    super(message);

    this._errorCode = errorCode;
    this._message = message;
  }

  get errorCode(): ResponseCodeEnum {
    return this._errorCode;
  }

  get message(): string {
    return this._message;
  }

  toResponse(): ResponsePayload<unknown> {
    return new ResponseBuilder<unknown>()
      .withCode(this._errorCode)
      .withMessage(this.message)
      .build();
  }
}
