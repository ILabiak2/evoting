import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ElectionService } from './election.service';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';
import { User } from '@/common/decorators/user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('election')
export class ElectionController {
  constructor(private readonly electionService: ElectionService) {}

  @Post()
  create(@Body() createElectionDto: CreateElectionDto, @User('userId') userId) {
    return this.electionService.create(createElectionDto, userId);
  }

  @Get()
  findAll() {
    return this.electionService.getData();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.electionService.getElectionData(+id);
  }
}
