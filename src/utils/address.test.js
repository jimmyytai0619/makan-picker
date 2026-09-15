import { describe, it, expect } from 'vitest'
import { formatOsmAddress, formatReverseAddress, googleMapsPlaceUrl, safeWebsiteUrl } from './address'

describe('formatOsmAddress', () => {
  it('builds "number street, postcode city"', () => {
    const tags = {
      'addr:housenumber': '21',
      'addr:street': 'Jalan 33/154',
      'addr:postcode': '56000',
      'addr:city': 'Kuala Lumpur',
    }
    expect(formatOsmAddress(tags)).toBe('21 Jalan 33/154, 56000 Kuala Lumpur')
  })

  it('works without a house number', () => {
    const tags = { 'addr:street': 'Jalan Suarasa 8/5', 'addr:postcode': '43200', 'addr:city': 'Cheras' }
    expect(formatOsmAddress(tags)).toBe('Jalan Suarasa 8/5, 43200 Cheras')
  })

  it('returns null when there is no street', () => {
    expect(formatOsmAddress({ 'addr:postcode': '43200' })).toBeNull()
    expect(formatOsmAddress()).toBeNull()
  })
})

describe('formatReverseAddress', () => {
  it('gives "road, area, suburb"', () => {
    const address = {
      road: 'Jalan Suarasa 8/5',
      residential: 'Town Park',
      suburb: 'Cheras',
      city: 'Kajang Municipal Council',
    }
    expect(formatReverseAddress(address)).toBe('Jalan Suarasa 8/5, Town Park, Cheras')
  })

  it('skips missing parts and repeated names', () => {
    expect(formatReverseAddress({ road: 'Jalan Cheras', suburb: 'Cheras', city: 'Cheras' })).toBe(
      'Jalan Cheras, Cheras',
    )
  })

  it('returns null when nothing useful comes back', () => {
    expect(formatReverseAddress({})).toBeNull()
    expect(formatReverseAddress()).toBeNull()
  })
})

describe('googleMapsPlaceUrl', () => {
  it('searches the name around the exact spot', () => {
    expect(googleMapsPlaceUrl({ name: 'Brew & Boulder', lat: 3.0457, lng: 101.759 })).toBe(
      'https://www.google.com/maps/search/Brew%20%26%20Boulder/@3.0457,101.759,17z',
    )
  })

  it('searches only the name when there is no location (saved cafes)', () => {
    expect(googleMapsPlaceUrl({ name: 'Kopi Hutan', lat: null, lng: null })).toBe(
      'https://www.google.com/maps/search/?api=1&query=Kopi%20Hutan',
    )
  })
})

describe('safeWebsiteUrl', () => {
  it('keeps http and https links', () => {
    expect(safeWebsiteUrl('https://tealive.com.my')).toBe('https://tealive.com.my')
    expect(safeWebsiteUrl('http://example.my/menu')).toBe('http://example.my/menu')
  })

  it('adds https:// when it is missing', () => {
    expect(safeWebsiteUrl('www.kopi.my')).toBe('https://www.kopi.my')
  })

  it('blocks dangerous or broken links', () => {
    expect(safeWebsiteUrl('javascript:alert(1)')).toBeNull()
    expect(safeWebsiteUrl('not a website')).toBeNull()
    expect(safeWebsiteUrl(null)).toBeNull()
  })
})
