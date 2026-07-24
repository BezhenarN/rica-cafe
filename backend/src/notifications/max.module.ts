import { Module } from '@nestjs/common';
import { MaxNotificationService } from './max.service';

@Module({
  providers: [MaxNotificationService],
  exports: [MaxNotificationService],
})
export class NotificationsModule {}
