import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedOrigin } from '../src/lib/origin-policy.ts';

test('same-origin browsers and native clients remain usable', () => {
  assert.equal(isAllowedOrigin(undefined, 'school.example', ''), true);
  assert.equal(isAllowedOrigin('https://school.example', 'school.example', ''), true);
  assert.equal(isAllowedOrigin('http://localhost:5173', 'localhost:5173', ''), true);
});
test('untrusted sites cannot use credentialed API requests', () => {
  for (const origin of ['https://evil.example', 'null', 'https://school.example.evil.test', 'https://evil@school.example', 'file://school.example', 'https://school.example/path']) {
    assert.equal(isAllowedOrigin(origin, 'school.example', ''), false, origin);
  }
});
test('a separate frontend needs an explicit exact origin', () => {
  assert.equal(isAllowedOrigin('https://frontend.example', 'api.example', 'https://frontend.example'), true);
  assert.equal(isAllowedOrigin('https://frontend.example.evil.test', 'api.example', 'https://frontend.example'), false);
  assert.equal(isAllowedOrigin('https://frontend.example:8443', 'api.example', 'https://frontend.example'), false);
});
