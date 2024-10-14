import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { SdkEntry, SdksResponse } from './types';
import { getPackage } from '../common/packageUtils';
import { PackagesService } from '../packages/packages.service';

const SDKS_PATH = path.join('..', 'sdks');

@Injectable()
export class SdksService {
  constructor(private packagesService: PackagesService) {}

  getSdks(strict: boolean = false): SdksResponse {
    const sdks: SdksResponse = {};
    try {
      const sdkLinks = fs.readdirSync(SDKS_PATH);
      for (const link of sdkLinks) {
        try {
          const latestJsonPath = path.join(SDKS_PATH, link, 'latest.json');
          const latestJsonContent = fs.readFileSync(latestJsonPath, 'utf8');
          const { canonical } = JSON.parse(latestJsonContent);
          const pkg = getPackage(canonical);
          if (pkg) {
            sdks[link] = pkg;
          } else if (strict) {
            throw new Error(
              `Package ${link}, canonical cannot be resolved: ${canonical}`,
            );
          }
        } catch (error) {
          if (strict) {
            throw error;
          }
          // If not strict, continue to the next SDK
        }
      }
    } catch (error) {
      console.error('Error reading SDKs directory:', error);
    }
    return sdks;
  }

  getSdk(sdkId: string, version: string = 'latest'): SdkEntry {
    const sdkFilePath = path.join(SDKS_PATH, sdkId, `${version}.json`);
    try {
      const { canonical } = JSON.parse(fs.readFileSync(sdkFilePath, 'utf8'));
      return getPackage(canonical, version);
    } catch (error) {
      console.error('Error reading SDK file:', error);
    }
  }

  getSdkVersions(sdkId: string): { latest: any; versions: string[] } {
    const latest = this.getSdk(sdkId);
    const { versions } = this.packagesService.getPackageVersions(
      latest.canonical as string,
    );
    return { latest, versions };
  }
}
