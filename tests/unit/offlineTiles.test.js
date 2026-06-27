/**
 * Unit tests for src/lib/offlineTiles.js
 * Tests tile coordinate math and URL generation (pure logic, no Cache API needed).
 */
import { describe, it, expect } from 'vitest'
import { getTileList } from '../../src/lib/offlineTiles'

const TEMPLATE = 'https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=TEST'

describe('offlineTiles — getTileList', () => {
  it('returns an array of tile URLs', () => {
    const tiles = getTileList(TEMPLATE)
    expect(Array.isArray(tiles)).toBe(true)
    expect(tiles.length).toBeGreaterThan(0)
  })

  it('generates URLs for zoom levels 10–14', () => {
    const tiles = getTileList(TEMPLATE)
    const zooms = new Set()
    for (const url of tiles) {
      const match = url.match(/outdoors\/(\d+)\//)
      if (match) zooms.add(Number(match[1]))
    }
    expect([...zooms].sort()).toEqual([10, 11, 12, 13, 14])
  })

  it('substitutes {z}, {x}, {y} placeholders correctly', () => {
    const tiles = getTileList(TEMPLATE)
    for (const url of tiles) {
      expect(url).not.toContain('{z}')
      expect(url).not.toContain('{x}')
      expect(url).not.toContain('{y}')
      expect(url).toContain('apikey=TEST')
    }
  })

  it('replaces {s} with fixed subdomain "a"', () => {
    const tmpl = 'https://{s}.tile.example.com/{z}/{x}/{y}.png'
    const tiles = getTileList(tmpl)
    for (const url of tiles) {
      expect(url).toContain('https://a.tile.example.com/')
      expect(url).not.toContain('{s}')
    }
  })

  it('tile count increases with zoom level (higher zoom = more tiles)', () => {
    const tiles = getTileList(TEMPLATE)
    const byZoom = new Map()
    for (const url of tiles) {
      const z = Number(url.match(/outdoors\/(\d+)\//)[1])
      byZoom.set(z, (byZoom.get(z) || 0) + 1)
    }

    // Each zoom level should have roughly 4x the tiles of the previous
    for (let z = 11; z <= 14; z++) {
      expect(byZoom.get(z)).toBeGreaterThan(byZoom.get(z - 1))
    }
  })

  it('generates a reasonable total tile count for the TMB bbox', () => {
    const tiles = getTileList(TEMPLATE)
    // TMB bbox at zooms 10-14 should produce roughly 100-5000 tiles
    // (depends on exact bbox; just a sanity check)
    expect(tiles.length).toBeGreaterThan(50)
    expect(tiles.length).toBeLessThan(10000)
  })

  it('all URLs are valid HTTPS URLs', () => {
    const tiles = getTileList(TEMPLATE)
    for (const url of tiles) {
      expect(url).toMatch(/^https:\/\//)
      // Should have integer x, y, z values
      const parts = url.match(/outdoors\/(\d+)\/(\d+)\/(\d+)\.png/)
      expect(parts).not.toBeNull()
    }
  })

  it('tile coordinates are non-negative integers', () => {
    const tiles = getTileList(TEMPLATE)
    for (const url of tiles) {
      const parts = url.match(/outdoors\/(\d+)\/(\d+)\/(\d+)\.png/)
      const [, z, x, y] = parts.map(Number)
      expect(z).toBeGreaterThanOrEqual(10)
      expect(z).toBeLessThanOrEqual(14)
      expect(x).toBeGreaterThanOrEqual(0)
      expect(y).toBeGreaterThanOrEqual(0)
      // At zoom z, x and y should be < 2^z
      expect(x).toBeLessThan(1 << z)
      expect(y).toBeLessThan(1 << z)
    }
  })
})
