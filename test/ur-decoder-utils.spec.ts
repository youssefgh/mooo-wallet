import { URDecoder } from '@ngraveio/bc-ur';
import { UrDecoderUtils } from '../src/app/core/ur-decoder-utils';

describe('UrDecoderUtils', () => {

  it(`should decode psbt`, () => {
    const urDecoder = new URDecoder();

    UrDecoderUtils.decode('UR:CRYPTO-PSBT/1543-3/LPCFAMATAXCFAOKSCYUEYTGRLUHDTEEMAYNSLYOEDECTKTKGTSNEPEMNAEAELOJLBERYTOLDRTHFAEAELAADAEAELAAEAEAELAAEADAELDAOAEAEAEADTISAFRPKGWSKBYGAZOJTADMKDRVDFDTLEOLNGWSTTYVAAERLFTMSFDMOKEEMCKWPADAEAEAEAEPSAXAEAEAOGAINAAAEAEAEAEAECPGYCXJKMURTCHCYROGWVDLNKOVOGSFWTALTSTSOMTWLVSKSBZJNKGHEEEOYGUGEFEKTGDBEDIAEAEAEAEAEAECPAECXDEOSKIAAGUZCFDSBCLGWDKMHCTFZMKWDAYONBDQDCEETNLSWJYSKBDMHCLECOSWLAEAEAEAEADADDNGAINAAAEAEAEAEAECPGYCXJKMURTCHCYROGWVDLNKOVOGSFWTALTSTSOMTWLVSKSBZZCIAIYEE', urDecoder);
    UrDecoderUtils.decode('UR:CRYPTO-PSBT/1535-3/LPCFAHZMAXCFAOKSCYUEYTGRLUHDTEAXJSRPSKJOCFCLSNBTLTCHPLLEAEAELDYKHFVTVAOYWMCNTEAXDATKHNLTRNREKOPFIAGUWEHLNYZSWZFYCPGEFLBZQZNSHGWNCPNBVOJTVSHDOTDICEHLCXAMGLSTTYIYAEMDFTEMHPFEINHLBWSFTYWSGRSKBAWSWMCWKIDNBDCLZSJLRKYTCTSGLSMYEELRJPIABZGDDWJEVEMSAABGGLMETKVWBAKPKKKKPSLSGUDIJLQDEEONLGTLUOSGNDZEKKBBDMWDCMOTJOKTEHSSSSSPGMBBCSPRTSJLLNCFDADTVEGLMSRSGLFDLDJYNSETCFSWZEPRZEHTGRHHSBOXOXVLFYIYOXNTLGIDRSKBURZOGERYASIMSEOTVLCPCXRLPAFZNLGEKEYLFDJKTLWFDPDTTOFSWSGYJZCNAEOSUOFX', urDecoder);
    const result = UrDecoderUtils.decode('UR:CRYPTO-PSBT/1546-3/LPCFAMBKAXCFAOKSCYUEYTGRLUHDTEHKAOKPJOJKIDJYZMADAELDAOAEAEAEADNYIOGRGLPATKROWEAEDWEOKEAELRFPCMMKPFMDPFMSNTSBATYNGUGSLNONLBEESBAEAEAEAEAEGHBAAEAEAOLOBWAEAEAEAEAEAECPAECXBGTSBZIMASCXTLWSGETDDMDAJSZMPFCHFPSEAXJKFNFXWMPKLDLGTDPYDNDPEHRSDSGOAAAEAEAEAEAECPGYCXRFWSPAFXCFPMSEZCZOSWJTHDBBSAMYPDUYWFURUEBNLBKTTKNDPRMEEOMNSKPYTOAEAEAEAEGWADAAECLTTKAXFGWEAOSWLAAEAEAELEKTKPSBIMINJZFDOXVLFYIONBRFFYRTHLMUSPFSCXFRLFBWOEVTONCEDNGDGTMEAOBGEEAOURVTKORTBYJEFDEEOECKBBENHDLNYKVT', urDecoder);

    expect(result.message).toEqual('cHNidP8BAIkCAAAAAZpnS06xz7jtACwzfACEQRaYsJWwl53LB/ZTTIalfzTLAAAAAABUDgAAAogTAAAAAAAAIgAgEtcVagkg1e9K0i4lcf+wF0HBA3M8Q+uqiY3SqystMb8mVQQAAAAAACJRILzvsUMZrcH9+8ZuWBTCj6jb89/eDH93z5uykTOOxavOAAAAAE8BBDWHzwNG7QLGgAAAAIp3dctqaWxIpONEZ6C8RMBdk8g9IDuCE6LgpRwrUE2RAhI0At/gdsARa0g0oh4UNjcInIGiKB93e9efr44AAIhvEL3OicBWAACAAQAAgAAAAIAAAQCJAgAAAAHQwjuqT8URSftuAZgq50jVM4ZPx9TmALc6l0iSfDce7AEAAAAArAMAAAJJaQQAAAAAACJRIHOTwBcauE/nhnbiTELZh8fJlunoeBVte180oVNKRXdQECcAAAAAAAAiACAop30EU/1IyyFPJJAfQJjqCKULsxw4mcZ0xQuQITWn6QAAAAABAStJaQQAAAAAACJRIHOTwBcauE/nhnbiTELZh8fJlunoeBVte180oVNKRXdQAQMEAAAAACEWZpnkzT4Dif0ch7r0YChTxlzKjjP1snEHEXLwAtM0M+kZAL3OicBWAACAAQAAgAAAAIABAAAABAAAAAEXIGaZ5M0+A4n9HIe69GAoU8Zcyo4z9bJxBxFy8ALTNDPpAAAhB+Lri+kXxmqGi1syYzWty/DmadS/zoN13+Hqu4VPn6SnGQC9zonAVgAAgAEAAIAAAACAAQAAAAUAAAABBSDi64vpF8ZqhotbMmM1rcvw5mnUv86Ddd/h6ruFT5+kpwA=');
    expect(result.error).toEqual(undefined);
  });

  it(`should error when incompatible`, () => {
    const urDecoder = new URDecoder();

    const result = UrDecoderUtils.decode('ur:crypto-output/taadmutaadeyoyaxhdclaoswaalbmwfpwekijndyfefzjtmdrtketphhktmngrlkwsfnospypsasrhhhjonnvwtsqzwljy', urDecoder);

    expect(result.message).toEqual(undefined);
    expect(result.error).toBeDefined();
  });

});
