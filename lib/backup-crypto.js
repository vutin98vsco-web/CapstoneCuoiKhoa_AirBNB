import { randomBytes, createCipheriv, createDecipheriv, publicEncrypt, privateDecrypt, constants } from 'node:crypto';
export function encryptBackup(data, publicKey) {
  const key = randomBytes(32), iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.from(JSON.stringify({ version: 1, algorithm: 'AES-256-GCM/RSA-OAEP-SHA256', key: publicEncrypt({ key: publicKey, oaepHash: 'sha256', padding: constants.RSA_PKCS1_OAEP_PADDING }, key).toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: encrypted.toString('base64') }));
}
export function decryptBackup(envelope, privateKey) {
  const value = JSON.parse(envelope.toString());
  if (value.version !== 1 || value.algorithm !== 'AES-256-GCM/RSA-OAEP-SHA256') throw new Error('Unsupported backup format');
  const key = privateDecrypt({ key: privateKey, oaepHash: 'sha256', padding: constants.RSA_PKCS1_OAEP_PADDING }, Buffer.from(value.key, 'base64'));
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(value.iv, 'base64')); decipher.setAuthTag(Buffer.from(value.tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(value.data, 'base64')), decipher.final()]);
}
