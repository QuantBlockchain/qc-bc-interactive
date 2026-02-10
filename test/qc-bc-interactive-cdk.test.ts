import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { QcBcInteractiveCdkStack } from '../lib/frontend-serverless-stack';

test('Lambda Function Created', () => {
  const app = new cdk.App();
  const stack = new QcBcInteractiveCdkStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::Lambda::Function', {
    Architectures: ['arm64'],
    MemorySize: 1024,
  });
});

test('CloudFront Distribution Created', () => {
  const app = new cdk.App();
  const stack = new QcBcInteractiveCdkStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.resourceCountIs('AWS::CloudFront::Distribution', 1);
});

test('DynamoDB Tables Created', () => {
  const app = new cdk.App();
  const stack = new QcBcInteractiveCdkStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  // Should have multiple DynamoDB tables (sessions, sentiments, votes, keys, etc.)
  template.resourceCountIs('AWS::DynamoDB::Table', 7);
});

test('API Gateway Created', () => {
  const app = new cdk.App();
  const stack = new QcBcInteractiveCdkStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.resourceCountIs('AWS::ApiGatewayV2::Api', 1);
});
