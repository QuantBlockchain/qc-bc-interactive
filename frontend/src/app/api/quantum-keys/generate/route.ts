import { NextRequest, NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { createHash, randomBytes } from 'crypto';

// Lambda configuration
const LAMBDA_FUNCTION_NAME = process.env.QUANTUM_LAMBDA_FUNCTION || 'quantum-key-generator';
const AWS_REGION = process.env.AWS_REGION_CUSTOM || process.env.AWS_REGION || 'us-west-2';

// Device mapping for display
const DEVICE_NAMES: Record<string, string> = {
  aws_sv1: 'Amazon Braket SV1',
  aws_dm1: 'Amazon Braket DM1',
  aws_tn1: 'Amazon Braket TN1',
  ionq_aria: 'IonQ Aria',
  ionq_forte: 'IonQ Forte',
  aqt_ibex_q1: 'AQT IBEX Q1',
  iqm_garnet: 'IQM Garnet',
  iqm_emerald: 'IQM Emerald',
  rigetti_ankaa3: 'Rigetti Ankaa-3',
  quera_aquila: 'QuEra Aquila',
  local_simulator: 'Local Simulator',
};

interface GenerateKeyRequest {
  device: string;
  sentiment?: string;
  timeframe?: string;
  sessionId?: string;
  useRealDevice?: boolean;
}

interface QuantumKeyResponse {
  success: boolean;
  quantum_number?: number;
  quantum_id?: string;
  entanglement_data?: number[];
  public_key?: string;
  signature?: string;
  algorithm?: string;
  device_id?: string;
  device_name?: string;
  processing_method?: string;
  job_id?: string;
  timestamp?: string;
  error?: string;
  trace?: string;
}

// ---------------------------------------------------------------------------
// Local key generation fallback (mirrors Python ToyLWE for demo purposes)
// ---------------------------------------------------------------------------

function generateLocalQuantumKeys(device: string, sentiment: string, sessionId: string) {
  const seed = `${sessionId}:${sentiment}:${Date.now()}`;

  // Quantum number (simulated)
  const qnHash = createHash('sha256').update(seed).digest();
  const quantumNumber = qnHash.readUInt16BE(0) % 1000;

  // Bell state probabilities (simulated with realistic noise)
  const noiseBytes = randomBytes(4);
  const noise = (noiseBytes[0] / 255) * 0.06 + 0.02; // 0.02-0.08
  const entanglementData = [
    0.5 - noise / 2,
    noise / 4,
    noise / 4,
    0.5 - noise / 2,
  ];

  // ToyLWE-style keypair generation
  const Q = 12289;
  const N = 64;
  const M = 64;

  const mixMaterial = Buffer.concat([
    Buffer.from('ToyLWE-KeyGen-v1'),
    qnHash.subarray(0, 16),
    randomBytes(32),
  ]);
  const xof = createHash('shake256', { outputLength: 64 } as never).update(mixMaterial).digest();
  const seedA = xof.subarray(32);

  // Sample small secret vector s and error vector e
  const s: number[] = [];
  const e: number[] = [];
  for (let i = 0; i < N; i++) {
    s.push(randomBytes(1)[0] % 3 - 1); // -1, 0, or 1
  }
  for (let i = 0; i < M; i++) {
    e.push(randomBytes(1)[0] % 3 - 1);
  }

  // Generate matrix A from seed and compute b = As + e (mod q)
  const b: number[] = [];
  let counter = 0;
  for (let i = 0; i < M; i++) {
    let dot = 0;
    for (let j = 0; j < N; j++) {
      const block = createHash('shake256', { outputLength: 2 } as never)
        .update(Buffer.concat([seedA, Buffer.from([counter >> 24, counter >> 16, counter >> 8, counter])]))
        .digest();
      const aij = block.readUInt16BE(0) % Q;
      dot = (dot + aij * s[j]) % Q;
      counter++;
    }
    b.push(((dot + e[i]) % Q + Q) % Q);
  }

  const skObj = { version: 'toy-lwe-1', q: Q, n: N, m: M, small_bound: 1, s };
  const pkObj = { version: 'toy-lwe-1', q: Q, n: N, m: M, A_seed: seedA.toString('base64'), b };

  const privateKey = Buffer.from(JSON.stringify(skObj)).toString('base64');
  const publicKey = Buffer.from(JSON.stringify(pkObj)).toString('base64');

  // Digital signature
  const messageToSign = `${sessionId}|${sentiment}|${quantumNumber}|${device}`;
  const messageHash = createHash('sha256').update(messageToSign).digest('hex');
  const entropyHash = createHash('sha256').update(String(quantumNumber)).digest('hex');
  const sigData = `${messageHash}:${entropyHash}:${privateKey.substring(0, 16)}`;
  const signature = Buffer.from(
    createHash('sha256').update(sigData).digest('hex')
  ).toString('base64');

  const numQubits = 8;
  const quantumId = (quantumNumber / Math.pow(2, numQubits)).toFixed(4);
  const jobId = `QJ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;

  return {
    success: true,
    quantum_number: quantumNumber,
    quantum_id: quantumId,
    entanglement_data: entanglementData,
    public_key: publicKey,
    private_key: privateKey,
    signature,
    algorithm: 'ToyLWE-Quantum-Seeded-Demo',
    device_id: device,
    device_name: DEVICE_NAMES[device] || device,
    processing_method: 'Local Simulation',
    job_id: jobId,
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Lambda invocation (with timeout)
// ---------------------------------------------------------------------------

async function invokeQuantumKeyLambda(data: GenerateKeyRequest): Promise<QuantumKeyResponse> {
  const lambdaClient = new LambdaClient({ region: AWS_REGION });

  const payload = {
    body: JSON.stringify({
      device: data.device || 'local_simulator',
      sentiment: data.sentiment || '',
      timeframe: data.timeframe || '',
      sessionId: data.sessionId || 'Anonymous',
      useRealDevice: data.useRealDevice || false,
    }),
  };

  console.log(`Invoking Lambda ${LAMBDA_FUNCTION_NAME} in region ${AWS_REGION} for device ${data.device}`);

  const command = new InvokeCommand({
    FunctionName: LAMBDA_FUNCTION_NAME,
    Payload: Buffer.from(JSON.stringify(payload)),
  });

  const LAMBDA_TIMEOUT_MS = 60000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LAMBDA_TIMEOUT_MS);

  try {
    const response = await lambdaClient.send(command, {
      abortSignal: controller.signal,
    });

    if (response.FunctionError) {
      const errorPayload = response.Payload
        ? JSON.parse(Buffer.from(response.Payload).toString())
        : { error: 'Unknown Lambda error' };
      console.error('Lambda function error:', response.FunctionError, errorPayload);
      throw new Error(`Lambda error: ${response.FunctionError} - ${JSON.stringify(errorPayload)}`);
    }

    const responsePayload = JSON.parse(
      Buffer.from(response.Payload || new Uint8Array()).toString()
    );

    // Handle Lambda response format (statusCode + body)
    if (responsePayload.statusCode && responsePayload.body) {
      const body = JSON.parse(responsePayload.body);
      if (responsePayload.statusCode >= 400) {
        throw new Error(body.error || `Lambda returned status ${responsePayload.statusCode}`);
      }
      return body;
    }

    return responsePayload;
  } finally {
    clearTimeout(timeoutId);
  }
}

// POST /api/quantum-keys/generate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      device = 'local_simulator',
      sentiment = '',
      timeframe = '',
      sessionId = '',
      useRealDevice = false,
    } = body as GenerateKeyRequest;

    // Try Lambda first, fall back to local generation
    let result: QuantumKeyResponse;
    try {
      result = await invokeQuantumKeyLambda({
        device,
        sentiment,
        timeframe,
        sessionId,
        useRealDevice,
      });

      if (!result.success) {
        console.warn(`Lambda returned unsuccessful for device ${device}: ${result.error}. Falling back to local generation.`);
        result = generateLocalQuantumKeys(device, sentiment, sessionId);
      }
    } catch (lambdaError) {
      console.warn(
        `Lambda invocation failed for device ${device}: ${lambdaError instanceof Error ? lambdaError.message : String(lambdaError)}. Falling back to local generation.`
      );
      result = generateLocalQuantumKeys(device, sentiment, sessionId);
    }

    // Transform the response to match frontend expected format
    const quantumNumber = result.quantum_number || 0;
    const numQubits = 8;
    const quantumId = result.quantum_id || (quantumNumber / Math.pow(2, numQubits)).toFixed(4);

    return NextResponse.json({
      success: true,
      async: false,
      quantumId,
      publicKey: result.public_key || '',
      signature: result.signature || '',
      jobId: result.job_id || `QJ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      device: result.device_id || device,
      deviceName: result.device_name || DEVICE_NAMES[device] || device,
      processingMethod: result.processing_method || result.device_name || 'Local Quantum Simulation',
      algorithm: result.algorithm || 'ToyLWE-Quantum-Seeded',
      quantumNumber: quantumNumber,
      entanglementData: result.entanglement_data || [0.5, 0, 0, 0.5],
      timestamp: result.timestamp || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating quantum keys:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate quantum keys',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// GET /api/quantum-keys/generate/status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      jobId,
      status: 'completed',
      message: 'Job status check - synchronous mode',
    });
  } catch (error) {
    console.error('Error checking quantum task status:', error);
    return NextResponse.json(
      { error: 'Failed to check task status', details: String(error) },
      { status: 500 }
    );
  }
}
