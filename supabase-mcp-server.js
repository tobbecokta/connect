#!/usr/bin/env node

const http = require('http');
const https = require('https');

const SUPABASE_ACCESS_TOKEN = 'sbp_9ccce2d5af22ecf39318fccf91b0803f81ee41c1';

function makeSupabaseApiRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.supabase.com',
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`API request failed with status ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function handleMcpRequest(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  if (req.method === 'POST') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const requestData = JSON.parse(body);
        
        console.log('Received MCP request:', JSON.stringify(requestData, null, 2));
        
        // Simple routing for different MCP actions
        if (requestData.action === 'getProjects') {
          const projects = await makeSupabaseApiRequest('GET', '/v1/projects');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ projects }));
        } 
        else if (requestData.action === 'getProjectData' && requestData.projectId) {
          const project = await makeSupabaseApiRequest('GET', `/v1/projects/${requestData.projectId}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ project }));
        }
        else if (requestData.action === 'executeQuery' && requestData.projectId && requestData.query) {
          // This is a simplified example - would need to use the actual Postgres connection details
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Query execution not implemented in simplified server' }));
        }
        else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unsupported action or missing parameters' }));
        }
      } catch (error) {
        console.error('Error processing request:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
}

// Create and start the server
const server = http.createServer(handleMcpRequest);
const PORT = 3333;

server.listen(PORT, () => {
  console.log(`MCP Server running at http://localhost:${PORT}`);
  console.log('Ready to receive requests from Cursor');
}); 