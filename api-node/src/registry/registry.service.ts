import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

const AWS_LAMBDA_LAYERS_PATH = path.join('..', 'aws-lambda-layers');

@Injectable()
export class RegistryService {
  async getAwsLambdaLayers() {
    const layers: Record<string, any> = {};
    const lambdaLayersDir = path.resolve(AWS_LAMBDA_LAYERS_PATH);
    const runtimeDirs = fs.readdirSync(AWS_LAMBDA_LAYERS_PATH);

    try {
      for (const runtime of runtimeDirs) {
        if (fs.lstatSync(path.join(lambdaLayersDir, runtime)).isDirectory()) {
          const latestLayerFile = path.join(
            AWS_LAMBDA_LAYERS_PATH,
            runtime,
            'latest.json',
          );
          const content = fs.readFileSync(latestLayerFile, 'utf-8');
          const data = JSON.parse(content);
          layers[data.canonical] = data;
        }
      }
    } catch (error) {
      console.error('Error reading AWS Lambda Layers directory:', error);
    }

    return layers;
  }
}
