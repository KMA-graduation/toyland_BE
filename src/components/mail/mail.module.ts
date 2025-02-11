import { join } from 'path';
import { Global, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';

import { MailService } from './mail.service';
import { MailConfig } from './mail.config';

@Global()
@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: new MailConfig().get('host'), // hostname
        secureConnection: false, // TLS requires secureConnection to be false
        port: new MailConfig().get('port'), // port for secure SMTP
        tls: {
          ciphers: new MailConfig().get('tls'),
        },
        auth: {
          type: 'login',
          user: new MailConfig().get('username'),
          pass: new MailConfig().get('password'),
        },
      },
      defaults: {
        from: `"No Reply" <${new MailConfig().get('noReply')}>`,
      },
      template: {
        dir: join(process.cwd(), 'templates'),
        adapter: new PugAdapter(),
        options: {
          strict: false,
        },
      },
    }),
  ],
  controllers: [],
  providers: [MailService],
})
export class MailModule {}
