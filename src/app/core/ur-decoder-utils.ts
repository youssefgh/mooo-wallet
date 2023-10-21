import { URDecoder } from "@ngraveio/bc-ur";

export class UrDecoderUtils {

  static isUr(text: string) {
    return text.toLocaleLowerCase().startsWith('ur:');
  }

  static decode(text: string, urDecoder: URDecoder) {
    let message: string;
    let error: string;
    urDecoder.receivePart(text);
    if (urDecoder.isComplete()) {
      if (urDecoder.isSuccess()) {
        const ur = urDecoder.resultUR();
        const decoded = ur.decodeCBOR();
        if (ur.type === 'crypto-psbt') {
          message = decoded.toString('base64');
        } else if (ur.type === 'bytes') {
          message = decoded.toString("hex");
        } else {
          error = `Incompatible type : ${ur.type}`;
        }
      }
      else {
        error = urDecoder.resultError();
      }
    }
    return { message, error }
  }

}
