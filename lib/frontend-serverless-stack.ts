import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

/**
 * Configuration options for the Quantum Blockchain Interactive Frontend Stack
 */
export interface QcBcInteractiveCdkStackProps extends cdk.StackProps {
  /**
   * Optional custom domain name for CloudFront
   */
  domainName?: string;

  /**
   * Lambda memory size in MB (default: 1024)
   */
  lambdaMemorySize?: number;

  /**
   * Lambda timeout in seconds (default: 30)
   */
  lambdaTimeout?: number;

  /**
   * Enable CloudFront access logging (default: true)
   */
  enableAccessLogging?: boolean;
}

/**
 * Quantum Blockchain Interactive Frontend Stack
 *
 * Architecture: CloudFront -> HTTP API Gateway -> Lambda (Docker) -> Next.js
 *
 * Features:
 * - Lambda Web Adapter for running Next.js as HTTP server
 * - Response streaming enabled for better performance
 * - ARM64 architecture for cost optimization
 * - CloudFront caching with optimized policies
 * - Access logging to S3 with 90-day retention
 */
export class QcBcInteractiveCdkStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;
  public readonly apiEndpoint: string;
  public readonly lambdaFunction: lambda.DockerImageFunction;
  public readonly quantumKeyLambda: lambda.DockerImageFunction;

  constructor(scope: Construct, id: string, props?: QcBcInteractiveCdkStackProps) {
    super(scope, id, props);

    const lambdaMemorySize = props?.lambdaMemorySize ?? 1024;
    const lambdaTimeout = props?.lambdaTimeout ?? 30;
    const enableAccessLogging = props?.enableAccessLogging ?? true;

    // ========================================
    // DynamoDB Tables
    // ========================================

    // Sessions Table - stores user journey sessions
    const sessionsTable = new dynamodb.Table(this, 'SessionsTable', {
      tableName: 'quantum-futures-sessions',
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    // Sentiments Table - stores user sentiment words
    const sentimentsTable = new dynamodb.Table(this, 'SentimentsTable', {
      tableName: 'quantum-futures-sentiments',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    sentimentsTable.addGlobalSecondaryIndex({
      indexName: 'word-index',
      partitionKey: { name: 'word', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Industry Votes Table - stores industry predictions
    const industryVotesTable = new dynamodb.Table(this, 'IndustryVotesTable', {
      tableName: 'quantum-futures-industry-votes',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    industryVotesTable.addGlobalSecondaryIndex({
      indexName: 'industry-index',
      partitionKey: { name: 'industry', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Quantum Keys Table - stores generated quantum keys
    const quantumKeysTable = new dynamodb.Table(this, 'QuantumKeysTable', {
      tableName: 'quantum-futures-quantum-keys',
      partitionKey: { name: 'quantumId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    quantumKeysTable.addGlobalSecondaryIndex({
      indexName: 'sessionId-index',
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Invite Codes Table - stores invite codes
    const inviteCodesTable = new dynamodb.Table(this, 'InviteCodesTable', {
      tableName: 'quantum-futures-invite-codes',
      partitionKey: { name: 'code', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Admins Table - stores admin users for dashboard access
    const adminsTable = new dynamodb.Table(this, 'AdminsTable', {
      tableName: 'quantum-futures-admins',
      partitionKey: { name: 'username', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Feedback Table - stores user feedback
    const feedbackTable = new dynamodb.Table(this, 'FeedbackTable', {
      tableName: 'quantum-futures-feedback',
      partitionKey: { name: 'feedbackId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // ========================================
    // S3 Bucket for Feedback File Uploads
    // ========================================
    const feedbackBucket = new s3.Bucket(this, 'FeedbackBucket', {
      // Let CDK auto-generate bucket name with random suffix
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(365), // Keep files for 1 year
        },
      ],
    });

    // ========================================
    // Quantum Key Generation Lambda (Python + Braket)
    // ========================================
    this.quantumKeyLambda = new lambda.DockerImageFunction(this, 'QuantumKeyLambda', {
      functionName: 'quantum-key-generator',
      code: lambda.DockerImageCode.fromImageAsset('./src', {
        file: 'Dockerfile.lambda',
        platform: cdk.aws_ecr_assets.Platform.LINUX_AMD64,
      }),
      memorySize: 512,
      timeout: cdk.Duration.seconds(120),
      architecture: lambda.Architecture.X86_64,
      environment: {
        AWS_REGION_CUSTOM: this.region,
        // Fix Numba caching issue in Lambda's read-only filesystem
        NUMBA_CACHE_DIR: '/tmp',
        // Disable parallel threading to avoid issues in Lambda
        NUMBA_NUM_THREADS: '1',
      },
      logGroup: new logs.LogGroup(this, 'QuantumKeyLambdaLogGroup', {
        logGroupName: '/aws/lambda/quantum-key-generator',
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Grant Braket permissions to the Quantum Key Lambda
    this.quantumKeyLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'braket:*',
      ],
      resources: ['*'],
    }));

    // Grant S3 permissions for Braket result storage
    // Braket requires creating/accessing buckets named amazon-braket-*
    this.quantumKeyLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        's3:CreateBucket',
        's3:GetObject',
        's3:PutObject',
        's3:ListBucket',
        's3:GetBucketLocation',
        's3:PutBucketPublicAccessBlock',
        's3:PutBucketPolicy',
      ],
      resources: [
        'arn:aws:s3:::amazon-braket-*',
        'arn:aws:s3:::amazon-braket-*/*',
      ],
    }));

    // ========================================
    // Lambda Function with Lambda Web Adapter
    // ========================================
    this.lambdaFunction = new lambda.DockerImageFunction(this, 'NextjsLambda', {
      functionName: 'frontend-nextjs',
      code: lambda.DockerImageCode.fromImageAsset('./frontend', {
        platform: cdk.aws_ecr_assets.Platform.LINUX_AMD64,
      }),
      memorySize: lambdaMemorySize,
      timeout: cdk.Duration.seconds(120),
      architecture: lambda.Architecture.X86_64,
      environment: {
        // Use buffered mode for API Gateway (response_stream requires Function URL)
        AWS_LWA_INVOKE_MODE: 'buffered',
        AWS_LWA_READINESS_CHECK_PATH: '/api/health',
        AWS_LWA_READINESS_CHECK_PORT: '3000',
        PORT: '3000',
        NODE_ENV: 'production',
        // DynamoDB table names
        SESSIONS_TABLE: sessionsTable.tableName,
        SENTIMENTS_TABLE: sentimentsTable.tableName,
        INDUSTRY_VOTES_TABLE: industryVotesTable.tableName,
        QUANTUM_KEYS_TABLE: quantumKeysTable.tableName,
        INVITE_CODES_TABLE: inviteCodesTable.tableName,
        ADMINS_TABLE: adminsTable.tableName,
        FEEDBACK_TABLE: feedbackTable.tableName,
        // S3 bucket for feedback files
        FEEDBACK_BUCKET: feedbackBucket.bucketName,
        AWS_REGION_CUSTOM: this.region,
        // Quantum Key Lambda configuration - use Lambda invoke with IAM auth
        USE_LAMBDA: 'true',
        QUANTUM_LAMBDA_FUNCTION: this.quantumKeyLambda.functionName,
      },
      logGroup: new logs.LogGroup(this, 'LambdaLogGroup', {
        logGroupName: '/aws/lambda/frontend-nextjs',
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Grant DynamoDB permissions to Lambda
    sessionsTable.grantReadWriteData(this.lambdaFunction);
    sentimentsTable.grantReadWriteData(this.lambdaFunction);
    industryVotesTable.grantReadWriteData(this.lambdaFunction);
    quantumKeysTable.grantReadWriteData(this.lambdaFunction);
    inviteCodesTable.grantReadWriteData(this.lambdaFunction);
    adminsTable.grantReadWriteData(this.lambdaFunction);
    feedbackTable.grantReadWriteData(this.lambdaFunction);

    // Grant S3 permissions to Lambda for feedback file uploads
    feedbackBucket.grantReadWrite(this.lambdaFunction);

    // Grant permission to invoke Quantum Key Lambda (IAM-based auth)
    this.quantumKeyLambda.grantInvoke(this.lambdaFunction);

    // ========================================
    // HTTP API Gateway
    // ========================================
    const httpApi = new apigatewayv2.HttpApi(this, 'FrontendApi', {
      apiName: 'frontend-api',
      description: 'HTTP API for Next.js frontend',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigatewayv2.CorsHttpMethod.ANY],
        allowHeaders: ['*'],
      },
    });

    const lambdaIntegration = new apigatewayv2Integrations.HttpLambdaIntegration(
      'LambdaIntegration',
      this.lambdaFunction,
    );

    // Root and catch-all routes
    httpApi.addRoutes({
      path: '/',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    this.apiEndpoint = httpApi.apiEndpoint;

    // ========================================
    // CloudFront Cache Policies
    // ========================================
    const apiDomain = cdk.Fn.select(2, cdk.Fn.split('/', httpApi.apiEndpoint));

    // Static assets cache policy (long TTL)
    const staticCachePolicy = new cloudfront.CachePolicy(this, 'StaticCachePolicy', {
      cachePolicyName: `${this.stackName}-Static`,
      defaultTtl: cdk.Duration.days(30),
      maxTtl: cdk.Duration.days(365),
      minTtl: cdk.Duration.days(1),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      headerBehavior: cloudfront.CacheHeaderBehavior.none(),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
    });

    // Dynamic content cache policy (no cache by default)
    const dynamicCachePolicy = new cloudfront.CachePolicy(this, 'DynamicCachePolicy', {
      cachePolicyName: `${this.stackName}-Dynamic`,
      defaultTtl: cdk.Duration.seconds(0),
      maxTtl: cdk.Duration.days(1),
      minTtl: cdk.Duration.seconds(0),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Accept-Language', 'Accept'),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
      cookieBehavior: cloudfront.CacheCookieBehavior.all(),
    });

    // Origin request policy
    const originRequestPolicy = new cloudfront.OriginRequestPolicy(this, 'OriginRequestPolicy', {
      originRequestPolicyName: `${this.stackName}-OriginRequest`,
      headerBehavior: cloudfront.OriginRequestHeaderBehavior.allowList('Accept-Language', 'Accept'),
      queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
      cookieBehavior: cloudfront.OriginRequestCookieBehavior.all(),
    });

    // ========================================
    // CloudFront Distribution
    // ========================================
    const apiOrigin = new origins.HttpOrigin(apiDomain, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
    });

    // Optional: Access logging bucket
    let logBucket: s3.Bucket | undefined;
    if (enableAccessLogging) {
      logBucket = new s3.Bucket(this, 'LogsBucket', {
        bucketName: `${this.stackName.toLowerCase()}-logs-${this.account}-${this.region}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        enforceSSL: true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
        lifecycleRules: [{ expiration: cdk.Duration.days(90) }],
      });
    }

    // Helper function for static behavior config
    const createStaticBehavior = (): cloudfront.BehaviorOptions => ({
      origin: apiOrigin,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
      cachePolicy: staticCachePolicy,
      compress: true,
    });

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: 'Quantum Blockchain Interactive Frontend',
      defaultBehavior: {
        origin: apiOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: dynamicCachePolicy,
        originRequestPolicy: originRequestPolicy,
        compress: true,
      },
      additionalBehaviors: {
        '_next/static/*': createStaticBehavior(),
        'api/*': {
          origin: apiOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: originRequestPolicy,
          compress: true,
        },
        '*.ico': createStaticBehavior(),
        '*.png': createStaticBehavior(),
        '*.svg': createStaticBehavior(),
        '*.jpg': createStaticBehavior(),
        '*.jpeg': createStaticBehavior(),
        '*.webp': createStaticBehavior(),
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enabled: true,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      sslSupportMethod: cloudfront.SSLMethod.SNI,
      ...(enableAccessLogging && logBucket && {
        enableLogging: true,
        logBucket: logBucket,
        logFilePrefix: 'cloudfront/',
      }),
    });

    // ========================================
    // CloudFront Cache Invalidation on Deploy
    // ========================================
    // Create a unique caller reference based on deployment time
    const timestamp = Date.now().toString();

    const invalidation = new cr.AwsCustomResource(this, 'CloudFrontInvalidation', {
      onUpdate: {
        service: 'CloudFront',
        action: 'createInvalidation',
        parameters: {
          DistributionId: this.distribution.distributionId,
          InvalidationBatch: {
            CallerReference: `invalidation-${timestamp}`,
            Paths: {
              Quantity: 1,
              Items: ['/*'],
            },
          },
        },
        physicalResourceId: cr.PhysicalResourceId.of(`invalidation-${timestamp}`),
      },
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: ['cloudfront:CreateInvalidation'],
          resources: [`arn:aws:cloudfront::${this.account}:distribution/${this.distribution.distributionId}`],
        }),
      ]),
      logGroup: new logs.LogGroup(this, 'InvalidationLogGroup', {
        logGroupName: '/aws/lambda/cloudfront-invalidation',
        retention: logs.RetentionDays.ONE_DAY,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Ensure invalidation happens after distribution is created
    invalidation.node.addDependency(this.distribution);

    // ========================================
    // Stack Outputs
    // ========================================
    new cdk.CfnOutput(this, 'FrontendURL', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'Frontend URL',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });

    new cdk.CfnOutput(this, 'ApiGatewayEndpoint', {
      value: httpApi.apiEndpoint,
      description: 'API Gateway Endpoint',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.lambdaFunction.functionName,
      description: 'Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'QuantumKeyLambdaName', {
      value: this.quantumKeyLambda.functionName,
      description: 'Quantum Key Generation Lambda Function Name',
    });
  }
}
