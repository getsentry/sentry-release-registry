import { Controller, Get } from '@nestjs/common';
import { RegistryService } from '../common/registry.service';

@Controller('aws-lambda-layers')
export class AwsLambdaLayersController {
  // TODO: types

  constructor(private readonly registryService: RegistryService) {}

  @Get()
  async getLayers() {
    return this.registryService.getAwsLambdaLayers();
  }
}
