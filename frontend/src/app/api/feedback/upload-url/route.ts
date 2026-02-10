import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { FEEDBACK_BUCKET } from '@/lib/dynamodb';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION_CUSTOM || process.env.AWS_REGION || 'us-east-1',
});

// POST - Get presigned URL for file upload
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileType } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'fileName and fileType are required' },
        { status: 400 }
      );
    }

    // Generate unique file key
    const fileExtension = fileName.split('.').pop() || '';
    const fileKey = `feedback/${uuidv4()}.${fileExtension}`;

    // Create presigned URL for upload
    const putCommand = new PutObjectCommand({
      Bucket: FEEDBACK_BUCKET,
      Key: fileKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, putCommand, {
      expiresIn: 3600, // 1 hour
    });

    return NextResponse.json({
      uploadUrl,
      fileKey,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}

// GET - Get presigned URL for file download
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileKey = searchParams.get('fileKey');

    if (!fileKey) {
      return NextResponse.json(
        { error: 'fileKey is required' },
        { status: 400 }
      );
    }

    const getCommand = new GetObjectCommand({
      Bucket: FEEDBACK_BUCKET,
      Key: fileKey,
    });

    const downloadUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: 3600, // 1 hour
    });

    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}
