import { Controller, Get, Param } from '@nestjs/common';
import { PackagesService } from './packages.service';

@Controller('packages')
export class PackagesController {
  constructor(private packagesService: PackagesService) {}

  @Get()
  getPackages() {
    return this.packagesService.getPackages();
  }

  @Get('/:package(*)/versions')
  getPackageVersions(@Param('package') pgkName: string) {
    return this.packagesService.getPackageVersions(pgkName);
  }

  @Get('/:package(*)/:version')
  getPackageByVersion(
    @Param('package') pkgName: string,
    @Param('version') version: string,
  ) {
    return this.packagesService.getPackageByVersion(pkgName, version);
  }
}
