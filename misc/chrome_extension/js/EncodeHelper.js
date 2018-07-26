class EncodeHelper {
  /**
   * A better btoa() function that doesn't crash everytime...
   *
   * https://stackoverflow.com/questions/19124701/get-image-using-jquery-ajax-and-decode-it-to-base64
   *
   * @param {string} str - The string to encode
   * @returns The base64 encoded string
   */
  static base64(str) {
    /*jslint bitwise: true */
    let CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let out = [],
      i = 0,
      len = str.length,
      c1,
      c2,
      c3;
    while (i < len) {
      c1 = str.charCodeAt(i++) & 0xff;
      if (i === len) {
        out.push(CHARS.charAt(c1 >> 2), CHARS.charAt((c1 & 0x3) << 4), '==');
        break;
      }
      c2 = str.charCodeAt(i++);
      if (i === len) {
        out.push(CHARS.charAt(c1 >> 2), CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xf0) >> 4)), CHARS.charAt((c2 & 0xf) << 2), '=');
        break;
      }
      c3 = str.charCodeAt(i++);
      out.push(CHARS.charAt(c1 >> 2), CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xf0) >> 4)), CHARS.charAt(((c2 & 0xf) << 2) | ((c3 & 0xc0) >> 6)), CHARS.charAt(c3 & 0x3f));
    }
    return out.join('');
  }

  /**
   * Converts hex to ascii
   * https://stackoverflow.com/questions/3745666/how-to-convert-from-hex-to-ascii-in-javascript
   *
   * @param {string} hexx - the hex
   * @returns ascii value
   */
  static hex2a(hexx) {
    let aStr = [],
      hex = hexx.toString(); //force conversion

    for (let i = 0; i < hex.length; i += 2) {
      aStr.push(String.fromCharCode(parseInt(hex.substr(i, 2), 16)));
    }
    return aStr.join('');
  }

  /**
   * Converts a UTF-8 string into UTF-16LE
   * while staying in a UTF-8 context
   *
   * Example:
   * Let's say you have the string "aaaa"
   * The extension tester would take the two first letters and merge them into a chinese symbol
   * So it would look like this: 慡慡
   * When you look at the unicode of those characters, it comes out to: \u6161
   * "61" being the hex of a
   * To combat this, one needs to take the string and add another UTF-8 character to it,
   * so if I wanted the string "aaaa" to appear, I would need to pass the string: "a\0a\0a\0a\0"
   * This string would get converted into the unicode \u6100, which is the letter "a" we're looking for
   * So this code creates a UTF-16 string: \u0061
   * It flips the character: \u6100
   * Encodes each character into ascii, for example: a\0
   * Then it sends it back.
   * This also works with any valid unicode character, so encoding issues shouldn't be present
   *
   * Inspired from
   * https://gist.github.com/mathiasbynens/1243213
   *
   * @param {string} str - The string to convert
   * @returns The UTF-16LE string
   */
  static unicodeEscape(str) {
    return str.replace(/[\s\S]/g, escape => {
      let code = ('0000' + escape.charCodeAt().toString(16)).slice(-4);
      code = EncodeHelper.hex2a(code.substr(2, 2) + code.substr(0, 2));
      return code;
    });
  }
}
