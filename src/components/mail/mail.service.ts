/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

import { ResponsePayload } from '@utils/response-payload';
import { ResponseBuilder } from '@utils/response-builder';
import { ApiError } from '@utils/api.error';
import { ResponseCodeEnum } from '@enums/response-code.enum';
import { SendMailRequestDto } from './dto/send-mail.request.dto';
import { join } from 'path';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private mailerService: MailerService) {}

  public async sendMail(
    request: SendMailRequestDto,
  ): Promise<ResponsePayload<any>> {
    try {
      const { email, body } = request;

      await this.mailerService.sendMail({
        to: email,
        subject: body.subject,
        html: body.text,
        template: join(process.cwd(), 'templates', body.template),
        context: body.context,
      });

      this.logger.error('[MAIL_SERVICE][SUCCESS]: ', email);
      return new ResponseBuilder().withCode(ResponseCodeEnum.SUCCESS).build();
    } catch (error) {
      this.logger.error('[MAIL_SERVICE]', error);
      return new ApiError(ResponseCodeEnum.NOT_FOUND).toResponse();
    }
  }
}
