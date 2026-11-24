import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';

@Module({
  imports: [NotificationsModule],
  controllers: [CollectionsController],
  providers: [CollectionsService],
})
export class CollectionsModule {}
