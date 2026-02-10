#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { QcBcInteractiveCdkStack } from '../lib/frontend-serverless-stack';

const app = new cdk.App();

new QcBcInteractiveCdkStack(app, 'QcBcInteractiveCdkStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
