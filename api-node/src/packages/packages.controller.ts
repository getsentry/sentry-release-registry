import { Controller, Get, Param } from '@nestjs/common';
import { RegistryService } from '../common/registry.service';

@Controller('packages')
export class PackagesController {
  constructor(private registryService: RegistryService) {}

  @Get()
  getPackages() {
    return this.registryService.getPackages();
  }

  @Get('/:package(*)/versions')
  getPackageVersions(@Param('package') pgkName: string) {
    return this.registryService.getPackageVersions(pgkName);
  }

  @Get('/:package(*)/:version')
  getPackageByVersion(
    @Param('package') pkgName: string,
    @Param('version') version: string,
  ) {
    return this.registryService.getPackageByVersion(pkgName, version);
  }
}
