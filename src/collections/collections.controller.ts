import { Body, Controller, Param, Post } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { StartDropDto } from './dto/start-drop.dto';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post(':id/start')
  startDrop(
    @Param('id') collectionId: string,
    @Body() dto: StartDropDto,
  ): Promise<{ success: boolean; message: string; room: string; event: string; emailMessageId: string }> {
    return this.collectionsService.startDrop(collectionId, dto);
  }
}
