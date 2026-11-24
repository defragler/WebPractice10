import { Controller, MessageEvent, Sse } from '@nestjs/common';
import { Observable, interval, map } from 'rxjs';
import { EventsGateway } from './events.gateway';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly eventsGateway: EventsGateway) {}

  @Sse('events/stream')
  streamEvents(): Observable<MessageEvent> {
    return interval(5000).pipe(
      map((tick) => ({
        type: 'systemUpdate',
        data: {
          status: 'online',
          activeConnections: this.eventsGateway.getActiveConnections(),
          serverTime: new Date().toISOString(),
          tick: tick + 1,
        },
      })),
    );
  }
}
