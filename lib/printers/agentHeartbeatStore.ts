export interface AgentHeartbeat {
  tenantId: string
  tenantName: string
  lastSeenAt: string
  ip?: string
}

// Map em memória no processo Node.js
const heartbeats = new Map<string, AgentHeartbeat>()

export function recordAgentHeartbeat(tenantId: string, tenantName: string, ip?: string) {
  heartbeats.set(tenantId, {
    tenantId,
    tenantName,
    lastSeenAt: new Date().toISOString(),
    ip: ip || undefined,
  })
}

export function getAgentHeartbeats(): AgentHeartbeat[] {
  return Array.from(heartbeats.values())
}

export function getAgentHeartbeat(tenantId: string): AgentHeartbeat | undefined {
  return heartbeats.get(tenantId)
}

