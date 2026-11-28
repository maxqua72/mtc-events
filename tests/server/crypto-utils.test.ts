// tests/server/crypto-utils.test.ts
// Cifratura dei dati dei soci e hash delle password interne.
import { describe, it, expect } from 'vitest'
import { scryptSync } from 'node:crypto'
import {
  encrypt,
  decrypt,
  maskEmail,
  maskSurname,
  hashInternalPassword
} from '../../server/utils/crypto-utils'

describe('encrypt / decrypt', () => {
  it('decifra quello che ha cifrato', () => {
    const value = 'mario.rossi@example.org'
    expect(decrypt(encrypt(value))).toBe(value)
  })

  it('usa un IV casuale: due cifrature dello stesso valore sono diverse', () => {
    expect(encrypt('Rossi')).not.toBe(encrypt('Rossi'))
  })

  it('produce il formato iv:tag:testo', () => {
    const [iv, tag, text] = encrypt('x').split(':')
    expect(iv).toHaveLength(24) // 12 byte
    expect(tag).toHaveLength(32) // 16 byte
    expect(text.length).toBeGreaterThan(0)
  })

  it('restituisce invariati i valori non cifrati (dati storici in chiaro)', () => {
    expect(decrypt('Rossi')).toBe('Rossi')
    expect(decrypt('')).toBe('')
  })

  it('rifiuta un dato cifrato manomesso', () => {
    const [iv, tag, text] = encrypt('Rossi').split(':')
    const tampered = `${iv}:${tag}:${text.slice(0, -2)}${text.endsWith('00') ? '11' : '00'}`
    expect(() => decrypt(tampered)).toThrow()
  })
})

describe('mascheramento', () => {
  it('maschera email e cognome', () => {
    expect(maskEmail('mario.rossi@example.org')).not.toContain('mario.rossi')
    expect(maskEmail('mario.rossi@example.org')).toContain('@')
    expect(maskEmail(null)).toBe('****@****')
    expect(maskSurname('Rossi')).toBe('R****')
    expect(maskSurname('')).toBe('****')
  })
})

describe('hashInternalPassword', () => {
  it('genera salt casuale e un hash verificabile con lo stesso algoritmo del login', () => {
    const { hash, salt } = hashInternalPassword('Password-di-prova')
    expect(salt).toHaveLength(32)
    expect(hash).toHaveLength(128)
    expect(scryptSync('Password-di-prova', salt, 64).toString('hex')).toBe(hash)
    expect(hashInternalPassword('Password-di-prova').salt).not.toBe(salt)
  })
})
