import { UR, UREncoder } from "@ngraveio/bc-ur";

export class UrEncoderUtils {

  static encodePsbt(text: string) {
    const ur = UR.from(text, 'base64');
    (ur as any)._type = 'crypto-psbt';
    const encoder = new UREncoder(ur, 200);
    return encoder.encodeWhole();
  }

  static encodeBytes(text: string) {
    const ur = UR.from(text);
    const encoder = new UREncoder(ur, 200);
    return encoder.encodeWhole();
  }

}
