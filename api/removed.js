// Serverless function: the shared "removed places" list.
//   GET    /api/removed            -> { removed: [...], shared: true }
//   POST   /api/removed  {id,name,category}  -> remove a place for everyone
//   DELETE /api/removed?id=osm-node-123      -> restore it (e.g. removed by mistake)
//
// Uses plain Node.js req/res, so the SAME code runs on Vercel and in `npm run dev`
// (see the devApi plugin in vite.config.js).

import { addRemoved, isValidId, listRemoved, parseEntry, restoreRemoved, storageMode } from './_removedStore.js'

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store') // always fresh: someone may have just removed a place
  res.end(JSON.stringify(body))
}

/** The JSON the browser sent. Vercel may have read it already (req.body); npm run dev hasn't. */
async function readJsonBody(req) {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > 10_000) throw new Error('Body too big')
  }
  return raw ? JSON.parse(raw) : {}
}

export default async function handler(req, res) {
  if (storageMode() === 'unavailable') {
    // No shared database connected yet: the app then removes places on that phone only.
    return sendJson(res, 503, { error: 'The shared removed list is not set up yet.', notSetUp: true })
  }

  try {
    if (req.method === 'GET') {
      return sendJson(res, 200, { removed: await listRemoved(), shared: true })
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req).catch(() => null)
      const parsed = parseEntry(body)
      if ('error' in parsed) return sendJson(res, 400, { error: parsed.error })
      await addRemoved(parsed.entry)
      return sendJson(res, 200, { ok: true, entry: parsed.entry })
    }

    if (req.method === 'DELETE') {
      const id = new URL(req.url, 'http://localhost').searchParams.get('id')
      if (!isValidId(id)) return sendJson(res, 400, { error: 'id must look like osm-node-123' })
      await restoreRemoved(id)
      return sendJson(res, 200, { ok: true })
    }

    return sendJson(res, 405, { error: 'Use GET, POST or DELETE' })
  } catch (err) {
    console.error(err.message) // appears in Vercel's Logs tab
    return sendJson(res, 503, { error: 'The shared removed list is not available right now.' })
  }
}
