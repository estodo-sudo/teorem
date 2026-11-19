/**
 * The real vault codec (expo-crypto AES-256-GCM): the module's web implementation runs on Node's
 * WebCrypto, with the keychain kept in memory (web path of device.ts).
 */
jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));
jest.mock('expo', () => ({
  NativeModule: class {},
  CodedError: class extends Error {},
  registerWebModule: (M: new () => unknown) => new M(),
  requireNativeModule: () => ({}),
}));
jest.mock('../node_modules/expo-crypto/build/aes/ExpoCryptoAES', () => jest.requireActual('../node_modules/expo-crypto/build/aes/ExpoCryptoAES.web'));
jest.mock('expo-local-authentication', () => ({}));
jest.mock('expo-secure-store', () => ({}));

describe('AES vault codec', () => {
  it('seals to ciphertext and opens it again; tampering is detected', async () => {
    const { aesCodec } = jest.requireActual<typeof import('@/features/camps/odak/privacy/device')>('@/features/camps/odak/privacy/device');
    const text = JSON.stringify({ note: 'Gece geç saatte güçlü bir istek 🎯' });
    const sealed = await aesCodec.seal(text);
    expect(sealed).not.toContain('istek');
    expect(sealed).not.toBe(await aesCodec.seal(text)); // fresh IV every time
    expect(await aesCodec.open(sealed)).toBe(text);
    const bytes = Buffer.from(sealed, 'base64');
    bytes[bytes.length - 1] = bytes[bytes.length - 1]! ^ 1;
    await expect(aesCodec.open(bytes.toString('base64'))).rejects.toBeTruthy();
  });
});
