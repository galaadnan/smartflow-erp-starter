import { Body, Controller, Get, Post } from '@nestjs/common';
import { CompaniesService } from './companies.service';

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
  ) {}

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @Post()
  create(
    @Body()
    data: {
      name: string;
      country?: string;
      currency?: string;
    },
  ) {
    return this.companiesService.create(data);
  }
}

