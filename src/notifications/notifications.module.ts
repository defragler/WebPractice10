import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { NotificationsController } from './notifications.controller';
import { MailService } from './mail.service';

@Module({
  controllers: [NotificationsController],
  providers: [EventsGateway, MailService],
  exports: [EventsGateway, MailService],
})
export class NotificationsModule {}
