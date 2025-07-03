import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ElectionService } from './election.service';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';

@Controller('election')
export class ElectionController {
  constructor(private readonly electionService: ElectionService) {}

  @Post()
  create(@Body() createElectionDto: CreateElectionDto) {
    return this.electionService.create(createElectionDto);
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
