/**
 * @fileoverview Get Secret Health Status
 * @description Returns rotation and access metadata for secrets.
 * Does NOT return actual secret values.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || !['admin', 'owner'].includes(user.role)) {
      return Response.json({
        error: 'Forbidden',
        message: 'Admin access required'
      }, { status: 403 });
    }
    
    const { name } = await req.json();
    
    // In production, this would call AWS Secrets Manager API
    // For now, return mock data
    const health = {
      name,
      rotation_enabled: true,
      last_rotated_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      last_accessed_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      needs_rotation: false
    };
    
    return Response.json(health);
  } catch (error) {
    return Response.json({
      error: 'Failed to fetch secret health',
      message: error.message
    }, { status: 500 });
  }
});