import { NextRequest, NextResponse } from 'next/server';
import {
  compareDevices,
  calculateDeviceImpact,
  getDevices,
  getRegions,
  getTechnologyDefaults,
  DEVICE_PROFILES,
} from '@/lib/envImpactCalculator';

// Re-export types for external use
export type {
  PhaseBreakdown,
  ImpactResult,
  DeviceImpactResponse,
  CompareDevicesResponse,
} from '@/lib/envImpactCalculator';

// Check if external Python API is configured
const ENV_IMPACT_API_URL = process.env.ENV_IMPACT_API_URL;
const USE_EXTERNAL_API = ENV_IMPACT_API_URL && !ENV_IMPACT_API_URL.includes('localhost');

/**
 * Try to call external Python API, fall back to TypeScript implementation
 */
async function tryExternalApi(
  endpoint: string,
  method: string,
  params: Record<string, unknown>,
  region?: string
): Promise<Response | null> {
  if (!USE_EXTERNAL_API || !ENV_IMPACT_API_URL) {
    return null;
  }

  try {
    const url = new URL(`${ENV_IMPACT_API_URL}${endpoint}`);
    if (region) {
      url.searchParams.set('region', region);
    }

    const fetchOptions: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (method === 'POST') {
      fetchOptions.body = JSON.stringify(params);
    }

    const response = await fetch(url.toString(), fetchOptions);
    if (response.ok) {
      return response;
    }
    console.warn(`External API returned ${response.status}, falling back to TypeScript`);
    return null;
  } catch (error) {
    console.warn('External API call failed, falling back to TypeScript:', error);
    return null;
  }
}

/**
 * POST /api/env-impact
 * Calculate environmental impacts for quantum devices
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'compare': {
        const { device_arns, usage_hours, region = 'quebec', overhead_factor } = params;
        if (!device_arns || !Array.isArray(device_arns) || device_arns.length === 0) {
          return NextResponse.json(
            { error: 'device_arns is required and must be a non-empty array' },
            { status: 400 }
          );
        }
        if (!usage_hours || typeof usage_hours !== 'number' || usage_hours <= 0) {
          return NextResponse.json(
            { error: 'usage_hours is required and must be a positive number' },
            { status: 400 }
          );
        }

        // Try external API first
        const externalResponse = await tryExternalApi('/compare', 'POST', params, region);
        if (externalResponse) {
          const data = await externalResponse.json();
          return NextResponse.json(data);
        }

        // Fall back to TypeScript implementation
        // Validate all device ARNs exist
        for (const arn of device_arns) {
          if (!DEVICE_PROFILES[arn]) {
            return NextResponse.json(
              { error: `Device not found: ${arn}. Available devices: ${Object.keys(DEVICE_PROFILES).join(', ')}` },
              { status: 404 }
            );
          }
        }
        const result = compareDevices(device_arns, usage_hours, region, overhead_factor);
        return NextResponse.json(result);
      }

      case 'calculate': {
        const { device_arn, usage_hours, region = 'quebec', overhead_factor } = params;
        if (!device_arn) {
          return NextResponse.json(
            { error: 'device_arn is required' },
            { status: 400 }
          );
        }
        if (!usage_hours || typeof usage_hours !== 'number' || usage_hours <= 0) {
          return NextResponse.json(
            { error: 'usage_hours is required and must be a positive number' },
            { status: 400 }
          );
        }

        // Try external API first
        const externalResponse = await tryExternalApi('/calculate', 'POST', params, region);
        if (externalResponse) {
          const data = await externalResponse.json();
          return NextResponse.json(data);
        }

        // Fall back to TypeScript implementation
        if (!DEVICE_PROFILES[device_arn]) {
          return NextResponse.json(
            { error: `Device not found: ${device_arn}` },
            { status: 404 }
          );
        }
        const result = calculateDeviceImpact(device_arn, usage_hours, region, overhead_factor);
        return NextResponse.json(result);
      }

      case 'devices': {
        // Try external API first
        const externalResponse = await tryExternalApi('/devices', 'GET', {});
        if (externalResponse) {
          const data = await externalResponse.json();
          return NextResponse.json(data);
        }

        const devices = getDevices();
        return NextResponse.json(devices);
      }

      case 'regions': {
        // Try external API first
        const externalResponse = await tryExternalApi('/regions', 'GET', {});
        if (externalResponse) {
          const data = await externalResponse.json();
          return NextResponse.json(data);
        }

        const regions = getRegions();
        return NextResponse.json(regions);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Environmental impact API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/env-impact
 * Get available devices, regions, or health check
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'devices';

    switch (action) {
      case 'devices': {
        // Try external API first
        const externalResponse = await tryExternalApi('/devices', 'GET', {});
        if (externalResponse) {
          const data = await externalResponse.json();
          return NextResponse.json(data);
        }

        const devices = getDevices();
        return NextResponse.json(devices);
      }

      case 'regions': {
        // Try external API first
        const externalResponse = await tryExternalApi('/regions', 'GET', {});
        if (externalResponse) {
          const data = await externalResponse.json();
          return NextResponse.json(data);
        }

        const regions = getRegions();
        return NextResponse.json(regions);
      }

      case 'health': {
        return NextResponse.json({
          status: 'healthy',
          service: 'qc-env-impact-api',
          mode: USE_EXTERNAL_API ? 'external' : 'typescript',
        });
      }

      case 'technology-defaults': {
        // Try external API first
        const externalResponse = await tryExternalApi('/technology-defaults', 'GET', {});
        if (externalResponse) {
          const data = await externalResponse.json();
          return NextResponse.json(data);
        }

        const defaults = getTechnologyDefaults();
        return NextResponse.json(defaults);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Environmental impact API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
