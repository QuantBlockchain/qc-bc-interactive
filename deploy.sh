#!/bin/bash

# Deploy script for QcBcInteractive (CloudFront + API Gateway + Lambda)

set -e

echo "Deploying QcBcInteractive to AWS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Authenticating Docker with AWS public ECR..."
if ! aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws; then
    echo -e "\033[31mERROR: Docker authentication with AWS public ECR failed. Please check your AWS credentials and Docker daemon.\033[0m"
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo -e "${RED}AWS CDK is not installed. Please install it first:${NC}"
    echo "npm install -g aws-cdk"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Get AWS account and region
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region || echo "us-east-1")

echo -e "${GREEN}Using AWS Account: ${AWS_ACCOUNT}${NC}"
echo -e "${GREEN}Using AWS Region: ${AWS_REGION}${NC}"

# Export environment variables for CDK
export CDK_DEFAULT_ACCOUNT=$AWS_ACCOUNT
export CDK_DEFAULT_REGION=$AWS_REGION

# Install root dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing CDK dependencies..."
    npm install
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..

# Build CDK TypeScript
echo "Building CDK TypeScript..."
npm run build

# Bootstrap CDK if needed
echo "Checking CDK bootstrap..."
if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region $AWS_REGION &> /dev/null; then
    echo -e "${YELLOW}CDK not bootstrapped. Bootstrapping now...${NC}"
    cdk bootstrap aws://$AWS_ACCOUNT/$AWS_REGION
else
    echo -e "${GREEN}CDK already bootstrapped${NC}"
fi

# Synthesize CDK template
echo "Synthesizing CDK template..."
cdk synth QcBcInteractiveCdkStack

# Deploy the Quantum Blockchain Interactive Frontend stack
echo "Deploying QcBcInteractiveCdkStack to AWS..."
cdk deploy QcBcInteractiveCdkStack --require-approval never

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
echo -e "${YELLOW}Stack outputs:${NC}"
aws cloudformation describe-stacks \
    --stack-name QcBcInteractiveCdkStack \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table

echo ""
echo -e "${GREEN}Your frontend is now accessible via CloudFront!${NC}"
echo -e "${YELLOW}Note: CloudFront distribution may take a few minutes to fully propagate.${NC}"
