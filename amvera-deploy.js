#!/usr/bin/env node
/**
 * Amvera MCP — single stream approach.
 * Uses ONE HTTP/2 stream for ALL communication (init + tools + calls).
 * The session is tied to the stream, not the connection.
 */

const http2 = require('http2');
const fs = require('fs');

const TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJtVmV0T3hCQlJhcWNpZHdnYUJROEF4UjcwMkk4QmtrRjRseXJWazFKU1BjIn0.eyJleHAiOjE4Nzk1Mzk2OTAsImlhdCI6MTc4NDkzMTY5MCwiYXV0aF90aW1lIjoxNzg0OTMxNDY2LCJqdGkiOiJvbnJ0bmE6N2I0YWY4YzAtYWJmZC0zN2YwLTlmNDUtMGM2NTQ5OTg5MDAxIiwiaXNzIjoiaHR0cHM6Ly9pZC5hbXZlcmEucnUvYXV0aC9yZWFsbXMvYW12ZXJhIiwiYXVkIjpbImFjY291bnQiLCJvcGVubWNwIl0sInN1YiI6ImJjMWVlMWYwLWMxYmEtNDc5Ny1iMzQxLTNmZjM3NjMwNDEwMyIsInR5cCI6IkJlYXJlciIsImF6cCI6ImFtdmVyYS1hcGkiLCJzaWQiOiJfRmc0S3plN0VVQkw2TU90akZBeWJMVnQiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbIi8qIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIiwiZGVmYXVsdC1yb2xlcy1hbXZlcmEiXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwaG9uZSBwcm9maWxlIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInByZWZlcnJlZF91c2VybmFtZSI6ImJlemhlbmFybiIsImVtYWlsIjoiYmV6aGVuYXJuQGxpdmUucnUifQ.EWPg-Fp60y5i6zv0l179GIjyt1CIv_93AvQwbpN-RGqiBvCVj83mVy5yYnVOdR7pNl92ae0hho5DHWtfHeVhweF489PhliQqOETwNntQO7x3zkx2wD5F2-WeLVDRiWhJgah_RIRDTIUy_d5SMaJidsaEVbUZsibFFTAc6Zjgyg1Pf3LAkfcqud1a03pTSsS12birqkLjE8_Xmi2vWEqYA0f5MSdpei19c6iZWwWDoLQwO10Tn8LqOQO4CU3D6AJA1jHZ3oLEF3wusZfGWVpSkgNa1Kk8_BlmmVlAOAdrPZ96ZtKYf80N4rQuikN6EHEF44Vf5BQq5-wXqTmAf1fzhA';

function parseSSE(text) {
  const results = [];
  for (const line of text.split('\n')) {
    if (line.startsWith('data: ')) {
      try { results.push(JSON.parse(line.slice(6))); } catch {}
    }
  }
  if (!results.length) {
    try { results.push(JSON.parse(text)); } catch {}
  }
  return results;
}

function sendOnStream(stream, id, method, params) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', method, params, id });

    stream.write(`${body}\n`);
    stream.setEncoding('utf8');

    stream.once('response', headers => {
      const sid = headers['mcp-session-id'] || headers['session-id'] || '';
      console.log('>>> Session-Id:', sid || '(none)');
    });

    let buffer = '';
    stream.on('data', chunk => {
      buffer += chunk;
      // Check for complete JSON responses in the buffer
      const results = parseSSE(buffer);
      if (results.length > 0) {
        // Find the one with matching id
        for (const r of results) {
          if (r.id == id) {
            // Consume remaining data from the stream
            stream.on('data', () => {});
            resolve(r);
            return;
          }
        }
      }
    });

    stream.once('end', () => {
      const results = parseSSE(buffer);
      for (const r of results) {
        if (r.id == id) { resolve(r); return; }
      }
      resolve(null);
    });

    stream.once('error', reject);
  });
}

async function main() {
  console.log('=== Connecting to Amvera MCP ===');
  const client = http2.connect('https://openmcp.msk0.amvera.ru', {
    ALPNProtocols: ['h2'],
  });

  client.on('error', err => { console.error('H2 Error:', err); process.exit(1); });

  // Create a SINGLE stream for ALL communication
  console.log('\nCreating single stream...');
  const stream = client.request({
    ':method': 'POST',
    ':path': '/mcp',
    ':scheme': 'https',
    ':authority': 'openmcp.msk0.amvera.ru',
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream, application/json',
  });

  // Step 1: Initialize
  console.log('\n=== Sending initialize ===');
  const init = await sendOnStream(stream, 1, 'initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'zcode', version: '1.0.0' },
  });
  console.log('Init result:', JSON.stringify(init?.result?.serverInfo));
  console.log('Full init:', JSON.stringify(init));

  // Step 2: List tools
  console.log('\n=== Listing tools ===');
  const tools = await sendOnStream(stream, 2, 'tools/list', {});
  console.log('Tools:', typeof tools === 'object' ? JSON.stringify(tools, null, 2).substring(0, 3000) : tools);

  // Step 3: If we got tools, list projects
  if (tools?.result?.tools?.length) {
    console.log('\n=== Available Tools ===');
    tools.result.tools.forEach(t => {
      console.log(`  ${t.name}: ${t.description?.substring(0, 100)}`);
    });

    // Try to list projects
    console.log('\n=== Listing Projects ===');
    const projects = await sendOnStream(stream, 3, 'tools/call', {
      name: tools.result.tools.find(t => t.name.toLowerCase().includes('project'))?.name || tools.result.tools[0].name,
      arguments: {},
    });
    console.log('Projects:', JSON.stringify(projects, null, 2).substring(0, 3000));
  }

  // Keep alive
  await new Promise(r => setTimeout(r, 5000));
  client.close();
  console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); });
