import { Controller, Get, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('Search')
@ApiBearerAuth()
@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Buscar en materias y contenidos visibles' })
  async search(@Request() req, @Query('q') query = '') {
    return this.searchService.search(
      req.usuario,
      query,
      req.user?.realm_access?.roles || [],
    );
  }
}
