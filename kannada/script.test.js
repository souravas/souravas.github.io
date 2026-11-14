// The note's spelling into Kannada script, for the voice and the Anki
// deck. Run with `npm test`.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { scriptWord, spoken, toScript } from './script.js'

test('long vowels, retroflex consonants and doubled letters', () => {
  assert.equal(scriptWord('haalu'), 'ಹಾಲು')
  assert.equal(scriptWord('haaLu'), 'ಹಾಳು')
  assert.equal(scriptWord('bEku'), 'ಬೇಕು')
  assert.equal(scriptWord('neeru'), 'ನೀರು')
  assert.equal(scriptWord('katte'), 'ಕತ್ತೆ')
  assert.equal(scriptWord('kannaDa'), 'ಕನ್ನಡ')
})

test('a nasal before a stop of its own kind is the anusvara', () => {
  assert.equal(scriptWord('enTu'), 'ಎಂಟು')
  assert.equal(scriptWord('bengaLooru'), 'ಬೆಂಗಳೂರು')
})

test('sh before T is the retroflex one, and a final th is a plain t', () => {
  assert.equal(scriptWord('eshTu'), 'ಎಷ್ಟು')
  assert.equal(scriptWord('sakkath'), 'ಸಕ್ಕತ್')
})

test('a hyphen joins, with a y between two vowels', () => {
  assert.equal(toScript('mane-alli'), 'ಮನೆಯಲ್ಲಿ')
  assert.equal(toScript('neevu Kannada maataaD-taa iddIra'), 'ನೀವು ಕನ್ನಡ ಮಾತಾಡ್ತಾ ಇದ್ದೀರ')
})

test('English words and names stay in English letters', () => {
  assert.equal(toScript('office-ge hOgtIni'), 'office ಗೆ ಹೋಗ್ತೀನಿ')
  assert.equal(toScript('nanna hesaru Geeta'), 'ನನ್ನ ಹೆಸರು Geeta')
})

test('names the note respells are said as Kannada', () => {
  assert.equal(toScript('Bengalur-alli'), 'ಬೆಂಗಳೂರಲ್ಲಿ')
})

test('the voice says the Kannada only: no gloss, alternatives as pauses', () => {
  assert.equal(spoken('ooTa — meal'), 'ಊಟ')
  assert.equal(spoken('baa / banni'), 'ಬಾ, ಬನ್ನಿ')
  assert.equal(spoken('nanage (nange)'), 'ನನಗೆ, ನಂಗೆ')
  assert.equal(spoken('idu pen alla — this is not a pen'), 'ಇದು pen ಅಲ್ಲ')
})
