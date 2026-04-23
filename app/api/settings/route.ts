import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const configDir = path.join(process.cwd(), 'profile');
const configPath = path.join(configDir, 'configuration.txt');

export async function GET() {
  try {
    await fs.mkdir(configDir, { recursive: true });
    try {
      const data = await fs.readFile(configPath, 'utf8');
      try {
        const json = JSON.parse(data);
        return NextResponse.json(json);
      } catch (e) {
        // Fallback if previous save was just text
        return NextResponse.json({ instructions: data, apiKey: '', modelName: '' });
      }
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        return NextResponse.json({ instructions: '', apiKey: '', modelName: '' });
      }
      throw e;
    }
  } catch (error: any) {
    console.error("Error reading config:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(body, null, 2), 'utf8');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error writing config:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
