
export class Bip21DecoderUtils {

    static isBip21(text: string) {
        return text.toLocaleLowerCase().startsWith('bitcoin:');
    }

    static decode(text: string) {
        let amount: number;
        let addressEndIndex = text.length;
        if (text.includes('?')) {
            addressEndIndex = text.indexOf('?');
            if (text.includes('amount=')) {
                let amountStartIndex = text.indexOf('amount=') + 7;
                let amountEndIndex = text.length;
                if (text.includes('&', amountStartIndex)) {
                    amountEndIndex = text.indexOf('&', amountStartIndex);
                }
                amount = parseFloat(text.substring(amountStartIndex, amountEndIndex));
            }
        }
        const address = text.substring(text.indexOf(':') + 1, addressEndIndex);
        return { address, amount };
    }

}
