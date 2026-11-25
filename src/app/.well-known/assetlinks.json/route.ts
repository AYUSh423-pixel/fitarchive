import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', '.well-known', 'assetlinks.json');

  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch {
      // Fallback below
    }
  }

  // Default Digital Asset Links format for Android TWA verification
  const defaultAssetLinks = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'app.vercel.nutrifit_smoky.twa',
        sha256_cert_fingerprints: [
          '14:6D:E9:7F:0E:52:D7:11:86:EC:F9:6B:9E:87:66:43:06:51:09:E0:4E:52:97:92:41:CE:39:B3:73:E6:CD:D8',
        ],
      },
    },
  ];

  return NextResponse.json(defaultAssetLinks, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
