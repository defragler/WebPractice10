import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private activeConnections = 0;

  handleConnection(client: Socket): void {
    this.activeConnections += 1;
    this.logger.log(`Клієнт підключився: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
    this.logger.log(`Клієнт відключився: ${client.id}`);
  }

  getActiveConnections(): number {
    return this.activeConnections;
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): void {
    client.emit('pong', {
      timestamp: new Date().toISOString(),
      message: "З'єднання активне'",
    });
  }

  @SubscribeMessage('broadcastNotification')
  handleBroadcast(
    @MessageBody() data: string | { message?: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const message =
      typeof data === 'string' ? data : String(data?.message ?? '');
    const payload = {
      sender: client.id,
      message,
      timestamp: new Date().toISOString(),
    };

    this.server.emit('globalAlert', payload);
    this.logger.log(`Глобальне сповіщення від ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: string | { roomId?: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const roomId = this.getRoomId(data);
    if (!roomId) {
      client.emit('roomError', { message: 'Не вказано ідентифікатор кімнати' });
      return;
    }

    await client.join(roomId);
    client.emit('joinedRoom', {
      roomId,
      message: `Ви приєдналися до кімнати ${roomId}`,
    });
    this.logger.log(`Клієнт ${client.id} приєднався до кімнати: ${roomId}`);
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() data: string | { roomId?: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const roomId = this.getRoomId(data);
    if (!roomId) {
      client.emit('roomError', { message: 'Не вказано ідентифікатор кімнати' });
      return;
    }

    await client.leave(roomId);
    client.emit('leftRoom', { roomId });
    this.logger.log(`Клієнт ${client.id} залишив кімнату: ${roomId}`);
  }

  emitToRoom(roomId: string, event: string, data: unknown): void {
    this.server.to(roomId).emit(event, data);
    this.logger.log(`Подію ${event} надіслано в кімнату ${roomId}`);
  }

  private getRoomId(data: string | { roomId?: string }): string {
    const value = typeof data === 'string' ? data : data?.roomId;
    return String(value ?? '').trim();
  }
}
