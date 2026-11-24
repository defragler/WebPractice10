import { Module } from '@nestjs/common';
import { NotificationsModule } from './notifications/notifications.module';
import { CollectionsModule } from './collections/collections.module';

@Module({
  imports: [NotificationsModule, CollectionsModule],
})
export class AppModule {}
