import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { CONTAINERS as SEED_CONTAINERS, BASES as SEED_BASES, TOPPINGS as SEED_TOPPINGS, TENANT as SEED_TENANT } from '@/lib/catalog'

let client, db, seeded = false

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME || 'acai_rose')
  }
  if (!seeded) { await seedIfEmpty(db); seeded = true }
  return db
}

async function seedIfEmpty(db) {
  const t = await db.collection('tenants').countDocuments({})
  if (t === 0) {
    await db.collection('tenants').insertOne({
      id: SEED_TENANT.id, name: SEED_TENANT.name, slug: SEED_TENANT.slug,
      active: true, createdAt: new Date(), deletedAt: null,
    })
  }
  const u = await db.collection('users').countDocuments({})
  if (u === 0) {
    await db.collection('users').insertMany([
      { id: uuidv4(), email: 'super@acairose.pt', name: 'Super Admin', password: '123456', role: 'SUPER_ADMIN', tenantId: null, active: true, createdAt: new Date(), deletedAt: null },
      { id: uuidv4(), email: 'admin@acairose.pt', name: 'Rosa — Dona da Loja', password: '123456', role: 'TENANT_ADMIN', tenantId: SEED_TENANT.id, active: true, createdAt: new Date(), deletedAt: null },
      { id: uuidv4(), email: 'caixa@acairose.pt', name: 'João — Caixa', password: '123456', role: 'CASHIER', tenantId: SEED_TENANT.id, active: true, createdAt: new Date(), deletedAt: null },
    ])
  }
  const c = await db.collection('containers').countDocuments({})
  if (c === 0) {
    await db.collection('containers').insertMany(SEED_CONTAINERS.map((x, i) => ({
      ...x, tenantId: SEED_TENANT.id, active: true, displayOrder: i,
      createdAt: new Date(), deletedAt: null,
    })))
  }
  const b = await db.collection('bases').countDocuments({})
  if (b === 0) {
    await db.collection('bases').insertMany(SEED_BASES.map((x, i) => ({
      ...x, tenantId: SEED_TENANT.id, active: true, displayOrder: i,
      createdAt: new Date(), deletedAt: null,
    })))
  }
  const tp = await db.collection('toppings').countDocuments({})
  if (tp === 0) {
    await db.collection('toppings').insertMany(SEED_TOPPINGS.map((x, i) => ({
      ...x, tenantId: SEED_TENANT.id, active: true, displayOrder: i,
      createdAt: new Date(), deletedAt: null,
    })))
  }
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}
export async function OPTIONS() { return handleCORS(new NextResponse(null, { status: 200 })) }

const VALID_PAYMENTS = ['NUMERARIO', 'MULTIBANCO', 'MB_WAY', 'PLATAFORMA']
const clean = (o) => { if (!o) return o; const { _id, ...r } = o; return r }

// Auth: token é apenas userId+random guardado em sessions
async function verifyToken(db, token) {
  if (!token) return null
  const s = await db.collection('sessions').findOne({ token })
  if (!s) return null
  const u = await db.collection('users').findOne({ id: s.userId, deletedAt: null })
  return u ? clean(u) : null
}

async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method
  try {
    const db = await connectToMongo()
    const url = new URL(request.url)
    const token = request.headers.get('x-auth-token') || url.searchParams.get('token')
    const authUser = await verifyToken(db, token)

    // ---------- AUTH ----------
    if (route === '/auth/login' && method === 'POST') {
      const { email, password } = await request.json()
      const user = await db.collection('users').findOne({ email: (email || '').toLowerCase().trim(), deletedAt: null })
      if (!user || user.password !== password || !user.active) {
        return handleCORS(NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 }))
      }
      const tok = uuidv4() + '-' + uuidv4()
      await db.collection('sessions').insertOne({ token: tok, userId: user.id, createdAt: new Date() })
      const { password: _, ...safe } = user
      return handleCORS(NextResponse.json({ token: tok, user: clean(safe) }))
    }
    if (route === '/auth/me' && method === 'GET') {
      if (!authUser) return handleCORS(NextResponse.json({ error: 'not_authenticated' }, { status: 401 }))
      const { password, ...safe } = authUser
      return handleCORS(NextResponse.json({ user: safe }))
    }
    if (route === '/auth/logout' && method === 'POST') {
      if (token) await db.collection('sessions').deleteOne({ token })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // ---------- PRODUCTS ----------
    // GET /api/products?tenantId=... — devolve tudo
    if (route === '/products' && method === 'GET') {
      const tenantId = url.searchParams.get('tenantId') || SEED_TENANT.id
      const [containers, bases, toppings] = await Promise.all([
        db.collection('containers').find({ tenantId, deletedAt: null }).sort({ displayOrder: 1 }).toArray(),
        db.collection('bases').find({ tenantId, deletedAt: null }).sort({ displayOrder: 1 }).toArray(),
        db.collection('toppings').find({ tenantId, deletedAt: null }).sort({ displayOrder: 1 }).toArray(),
      ])
      return handleCORS(NextResponse.json({
        containers: containers.map(clean),
        bases: bases.map(clean),
        toppings: toppings.map(clean),
      }))
    }

    // CRUD genérico containers|bases|toppings
    const m = route.match(/^\/products\/(containers|bases|toppings)(\/(.+))?$/)
    if (m) {
      if (!authUser || !['TENANT_ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
        return handleCORS(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
      }
      const col = m[1]; const id = m[3]
      if (!id && method === 'POST') {
        const body = await request.json()
        const doc = {
          id: uuidv4(), tenantId: authUser.tenantId || body.tenantId, active: true,
          displayOrder: Number(body.displayOrder) || 0,
          createdAt: new Date(), deletedAt: null,
          name: body.name || '',
          ...(col === 'containers' ? {
            precoBase: Number(body.precoBase) || 0,
            limiteBases: Number(body.limiteBases) || 1,
            limiteComplementosGratis: Number(body.limiteComplementosGratis) || 0,
            emoji: body.emoji || '🍨',
            image: body.image || null,
          } : {}),
          ...(col === 'bases' ? { description: body.description || '' } : {}),
          ...(col === 'toppings' ? {
            category: body.category || 'Frutas',
            isPremium: !!body.isPremium,
            precoExtra: Number(body.precoExtra) || 0,
            emoji: body.emoji || '✨',
          } : {}),
        }
        await db.collection(col).insertOne(doc)
        return handleCORS(NextResponse.json(clean(doc)))
      }
      if (id && method === 'PUT') {
        const body = await request.json()
        const $set = { updatedAt: new Date() }
        for (const k of ['name','description','category','emoji','image']) if (body[k] !== undefined) $set[k] = body[k]
        for (const k of ['precoBase','precoExtra','limiteBases','limiteComplementosGratis','displayOrder']) if (body[k] !== undefined) $set[k] = Number(body[k])
        if (body.isPremium !== undefined) $set.isPremium = !!body.isPremium
        if (body.active !== undefined) $set.active = !!body.active
        await db.collection(col).updateOne({ id, tenantId: authUser.tenantId }, { $set })
        const doc = await db.collection(col).findOne({ id })
        return handleCORS(NextResponse.json(clean(doc)))
      }
      if (id && method === 'DELETE') {
        await db.collection(col).updateOne({ id, tenantId: authUser.tenantId }, { $set: { deletedAt: new Date() } })
        return handleCORS(NextResponse.json({ ok: true }))
      }
    }

    // ---------- TENANTS (SUPER_ADMIN) ----------
    if (route === '/tenants' && method === 'GET') {
      if (!authUser || authUser.role !== 'SUPER_ADMIN') return handleCORS(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
      const list = await db.collection('tenants').find({ deletedAt: null }).sort({ createdAt: 1 }).toArray()
      return handleCORS(NextResponse.json({ tenants: list.map(clean) }))
    }
    if (route === '/tenants' && method === 'POST') {
      if (!authUser || authUser.role !== 'SUPER_ADMIN') return handleCORS(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
      const body = await request.json()
      if (!body.name) return handleCORS(NextResponse.json({ error: 'name obrigatório' }, { status: 400 }))
      const doc = {
        id: uuidv4(), name: body.name,
        slug: (body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).slice(0, 60),
        nif: body.nif || null, address: body.address || null, phone: body.phone || null,
        active: true, createdAt: new Date(), deletedAt: null,
      }
      await db.collection('tenants').insertOne(doc)
      // Seed default catalog para novo tenant a partir do catálogo demo
      for (const [col, seed] of [['containers', SEED_CONTAINERS], ['bases', SEED_BASES], ['toppings', SEED_TOPPINGS]]) {
        await db.collection(col).insertMany(seed.map((x, i) => ({
          ...x, id: uuidv4(), tenantId: doc.id, active: true, displayOrder: i,
          createdAt: new Date(), deletedAt: null,
        })))
      }
      return handleCORS(NextResponse.json(clean(doc)))
    }
    const tm = route.match(/^\/tenants\/([^/]+)$/)
    if (tm && (method === 'PUT' || method === 'DELETE')) {
      if (!authUser || authUser.role !== 'SUPER_ADMIN') return handleCORS(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
      if (method === 'PUT') {
        const body = await request.json()
        const $set = { updatedAt: new Date() }
        for (const k of ['name','nif','address','phone','slug']) if (body[k] !== undefined) $set[k] = body[k]
        if (body.active !== undefined) $set.active = !!body.active
        await db.collection('tenants').updateOne({ id: tm[1] }, { $set })
        const doc = await db.collection('tenants').findOne({ id: tm[1] })
        return handleCORS(NextResponse.json(clean(doc)))
      }
      await db.collection('tenants').updateOne({ id: tm[1] }, { $set: { deletedAt: new Date() } })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // ---------- USERS ----------
    if (route === '/users' && method === 'GET') {
      if (!authUser || !['SUPER_ADMIN','TENANT_ADMIN'].includes(authUser.role))
        return handleCORS(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
      const filter = { deletedAt: null }
      if (authUser.role === 'TENANT_ADMIN') filter.tenantId = authUser.tenantId
      else {
        const tid = url.searchParams.get('tenantId')
        if (tid) filter.tenantId = tid
      }
      const list = await db.collection('users').find(filter).sort({ createdAt: 1 }).toArray()
      return handleCORS(NextResponse.json({ users: list.map(({ password, ...u }) => clean(u)) }))
    }
    if (route === '/users' && method === 'POST') {
      if (!authUser || !['SUPER_ADMIN','TENANT_ADMIN'].includes(authUser.role))
        return handleCORS(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
      const body = await request.json()
      if (!body.email || !body.password || !body.name || !body.role)
        return handleCORS(NextResponse.json({ error: 'email, password, name e role obrigatórios' }, { status: 400 }))
      const role = body.role
      if (authUser.role === 'TENANT_ADMIN' && !['CASHIER','TENANT_ADMIN'].includes(role))
        return handleCORS(NextResponse.json({ error: 'role não permitido' }, { status: 403 }))
      const email = String(body.email).toLowerCase().trim()
      const exists = await db.collection('users').findOne({ email, deletedAt: null })
      if (exists) return handleCORS(NextResponse.json({ error: 'email já usado' }, { status: 409 }))
      const tenantId = authUser.role === 'TENANT_ADMIN' ? authUser.tenantId : (body.tenantId || null)
      const doc = {
        id: uuidv4(), email, name: body.name, password: body.password, role,
        tenantId: role === 'SUPER_ADMIN' ? null : tenantId,
        active: true, createdAt: new Date(), deletedAt: null,
      }
      await db.collection('users').insertOne(doc)
      const { password, ...safe } = doc
      return handleCORS(NextResponse.json(clean(safe)))
    }
    const um = route.match(/^\/users\/([^/]+)$/)
    if (um && (method === 'PUT' || method === 'DELETE')) {
      if (!authUser || !['SUPER_ADMIN','TENANT_ADMIN'].includes(authUser.role))
        return handleCORS(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
      const target = await db.collection('users').findOne({ id: um[1] })
      if (!target) return handleCORS(NextResponse.json({ error: 'não encontrado' }, { status: 404 }))
      if (authUser.role === 'TENANT_ADMIN' && target.tenantId !== authUser.tenantId)
        return handleCORS(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
      if (method === 'DELETE') {
        if (target.id === authUser.id) return handleCORS(NextResponse.json({ error: 'não te podes remover' }, { status: 400 }))
        await db.collection('users').updateOne({ id: um[1] }, { $set: { deletedAt: new Date(), active: false } })
        return handleCORS(NextResponse.json({ ok: true }))
      }
      const body = await request.json()
      const $set = { updatedAt: new Date() }
      for (const k of ['name']) if (body[k] !== undefined) $set[k] = body[k]
      if (body.password) $set.password = body.password
      if (body.active !== undefined) $set.active = !!body.active
      if (body.role && authUser.role === 'SUPER_ADMIN') $set.role = body.role
      await db.collection('users').updateOne({ id: um[1] }, { $set })
      const doc = await db.collection('users').findOne({ id: um[1] })
      const { password, ...safe } = doc
      return handleCORS(NextResponse.json(clean(safe)))
    }

    // ---------- ORDERS ----------
    if (route === '/orders' && method === 'POST') {
      const body = await request.json()
      const { tenantId, items, paymentMethod, cashierId, customerName, customerPhone } = body || {}
      if (!tenantId) return handleCORS(NextResponse.json({ error: 'tenantId obrigatório' }, { status: 400 }))
      if (!Array.isArray(items) || items.length === 0) return handleCORS(NextResponse.json({ error: 'items vazio' }, { status: 400 }))
      if (!VALID_PAYMENTS.includes(paymentMethod)) return handleCORS(NextResponse.json({ error: 'paymentMethod inválido' }, { status: 400 }))
      const subtotal = items.reduce((s, i) => s + (Number(i.lineTotal) || 0), 0)
      const total = +subtotal.toFixed(2)
      const start = new Date(); start.setHours(0,0,0,0)
      const countToday = await db.collection('orders').countDocuments({ tenantId, createdAt: { $gte: start } })
      const order = {
        id: uuidv4(), tenantId, cashierId: cashierId || authUser?.id || null,
        cashierName: authUser?.name || null,
        customerName: (customerName || '').trim() || null,
        customerPhone: (customerPhone || '').trim() || null,
        orderNumber: countToday + 1, subtotal: total, total, status: 'PAID', paymentMethod,
        items: items.map((i) => ({
          id: i.id || uuidv4(),
          containerId: i.container?.id, containerName: i.container?.name,
          containerEmoji: i.container?.emoji || '🍨',
          containerPrice: Number(i.container?.precoBase) || 0,
          freeToppingsAllowed: i.container?.limiteComplementosGratis || 0,
          bases: (i.bases || []).map((b) => ({ id: b.id, name: b.name })),
          toppings: (i.toppings || []).map((t) => ({
            id: t.id, name: t.name, emoji: t.emoji || '',
            isPremium: !!t.isPremium, isPaid: !!t.isPaid,
            precoCobrado: Number(t.precoCobrado) || 0,
          })),
          lineTotal: Number(i.lineTotal) || 0,
        })),
        createdAt: new Date(), deletedAt: null,
      }
      await db.collection('orders').insertOne(order)
      await db.collection('audit_logs').insertOne({
        id: uuidv4(), tenantId, userId: order.cashierId,
        action: 'ORDER_CREATED', entity: 'Order', entityId: order.id,
        metadata: { total, paymentMethod, orderNumber: order.orderNumber }, createdAt: new Date(),
      })
      return handleCORS(NextResponse.json(clean(order)))
    }

    if (route === '/orders' && method === 'GET') {
      const tenantId = url.searchParams.get('tenantId')
      if (!tenantId) return handleCORS(NextResponse.json({ error: 'tenantId obrigatório' }, { status: 400 }))
      const start = new Date(); start.setHours(0,0,0,0)
      const list = await db.collection('orders')
        .find({ tenantId, createdAt: { $gte: start }, deletedAt: null })
        .sort({ createdAt: -1 }).limit(500).toArray()
      return handleCORS(NextResponse.json({ orders: list.map(clean) }))
    }

    // Pesquisa de comandas por cliente (todo o histórico do tenant)
    if (route === '/orders/search' && method === 'GET') {
      const tenantId = url.searchParams.get('tenantId')
      const q = (url.searchParams.get('q') || '').trim()
      if (!tenantId) return handleCORS(NextResponse.json({ error: 'tenantId obrigatório' }, { status: 400 }))
      if (!q) return handleCORS(NextResponse.json({ orders: [] }))
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      const list = await db.collection('orders')
        .find({ tenantId, deletedAt: null, $or: [{ customerName: rx }, { customerPhone: rx }] })
        .sort({ createdAt: -1 }).limit(100).toArray()
      return handleCORS(NextResponse.json({ orders: list.map(clean) }))
    }

    // Cancelar comanda
    const cm = route.match(/^\/orders\/([^/]+)\/cancel$/)
    if (cm && method === 'POST') {
      if (!authUser || !['SUPER_ADMIN','TENANT_ADMIN'].includes(authUser.role))
        return handleCORS(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
      const body = await request.json().catch(() => ({}))
      const reason = (body.reason || '').trim()
      if (!reason || reason.length < 3) return handleCORS(NextResponse.json({ error: 'motivo obrigatório (mín 3 chars)' }, { status: 400 }))
      const order = await db.collection('orders').findOne({ id: cm[1], deletedAt: null })
      if (!order) return handleCORS(NextResponse.json({ error: 'não encontrado' }, { status: 404 }))
      if (authUser.role === 'TENANT_ADMIN' && order.tenantId !== authUser.tenantId)
        return handleCORS(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
      if (order.status === 'CANCELLED') return handleCORS(NextResponse.json({ error: 'já anulada' }, { status: 400 }))
      await db.collection('orders').updateOne({ id: cm[1] }, { $set: {
        status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason,
        cancelledById: authUser.id, cancelledByName: authUser.name,
      }})
      await db.collection('audit_logs').insertOne({
        id: uuidv4(), tenantId: order.tenantId, userId: authUser.id,
        action: 'ORDER_CANCELLED', entity: 'Order', entityId: order.id,
        metadata: { reason, orderNumber: order.orderNumber, total: order.total }, createdAt: new Date(),
      })
      const updated = await db.collection('orders').findOne({ id: cm[1] })
      return handleCORS(NextResponse.json(clean(updated)))
    }

    const om = route.match(/^\/orders\/([^/]+)$/)
    if (om && method === 'GET') {
      const order = await db.collection('orders').findOne({ id: om[1], deletedAt: null })
      if (!order) return handleCORS(NextResponse.json({ error: 'não encontrado' }, { status: 404 }))
      const tenant = await db.collection('tenants').findOne({ id: order.tenantId })
      return handleCORS(NextResponse.json({ order: clean(order), tenant: clean(tenant) }))
    }

    // ---------- REPORT ----------
    if (route === '/reports/day' && method === 'GET') {
      const tenantId = url.searchParams.get('tenantId')
      if (!tenantId) return handleCORS(NextResponse.json({ error: 'tenantId obrigatório' }, { status: 400 }))
      const dateStr = url.searchParams.get('date')
      const start = dateStr ? new Date(dateStr + 'T00:00:00') : new Date(); start.setHours(0,0,0,0)
      const end = new Date(start); end.setDate(end.getDate() + 1)
      const list = await db.collection('orders')
        .find({ tenantId, createdAt: { $gte: start, $lt: end }, deletedAt: null })
        .sort({ createdAt: 1 }).toArray()
      const byMethod = { NUMERARIO: { count: 0, total: 0 }, MULTIBANCO: { count: 0, total: 0 }, MB_WAY: { count: 0, total: 0 }, PLATAFORMA: { count: 0, total: 0 } }
      let total = 0, paidCount = 0, cancelledTotal = 0, cancelledCount = 0
      for (const o of list) {
        if (o.status === 'CANCELLED') {
          cancelledCount += 1
          cancelledTotal += Number(o.total) || 0
          continue
        }
        paidCount += 1
        total += Number(o.total) || 0
        const b = byMethod[o.paymentMethod] || (byMethod[o.paymentMethod] = { count: 0, total: 0 })
        b.count += 1; b.total += Number(o.total) || 0
      }
      Object.values(byMethod).forEach((b) => (b.total = +b.total.toFixed(2)))
      return handleCORS(NextResponse.json({
        date: start.toISOString().slice(0, 10),
        count: paidCount,
        total: +total.toFixed(2),
        cancelledCount, cancelledTotal: +cancelledTotal.toFixed(2),
        byMethod,
        orders: list.map(clean),
      }))
    }

    if (route === '/root' && method === 'GET') return handleCORS(NextResponse.json({ message: 'Açaí da Rose API' }))
    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error', detail: String(error?.message || error) }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
