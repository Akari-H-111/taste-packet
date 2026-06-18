/**
 * security.ts — Cross-XOR self-healing error correction.
 *
 * The last two bytes of every .taste matrix (Byte 14 and Byte 15) are
 * vertical parity codes.  They protect Column 2 and Column 1 respectively.
 *
 * When the network drops bytes during transmission, the client does NOT
 * request a retransmission.  Instead, it XORs the surviving column members
 * against the safety code to recover the missing value — in a single clock
 * cycle, with zero network round-trips.
 *
 * Encoding formulas (server side):
 *
 *   SafetyCode14 = Byte[2] ⊕ Byte[6] ⊕ Byte[10]
 *   SafetyCode15 = Byte[1] ⊕ Byte[5] ⊕ Byte[9] ⊕ Byte[13]
 *
 * Recovery formulas (client side):
 *
 *   Byte[2]  = Byte[6]  ⊕ Byte[10] ⊕ Byte[14]    (Visual Color C)
 *   Byte[13] = Byte[1]  ⊕ Byte[5]  ⊕ Byte[9] ⊕ Byte[15]  (Interaction bitmask)
 */

export const enum CorruptedField {
  None         = 0,
  VertexColorC = 2,   // Byte index 2  — Column 2, Row 0
  Interaction  = 13,  // Byte index 13 — Column 1, Row 3
}

export class TasteSecurity {
  /**
   * Compute and write both safety codes into the matrix buffer.
   * Call this on the server after populating Bytes 0–13.
   */
  static seal(buf: Uint8Array): void {
    if (buf.length !== 16) {
      throw new RangeError('seal() expects a 16-byte buffer');
    }
    // Column 2 parity: protects VertexColorC (Byte 2)
    buf[14] = buf[2] ^ buf[6] ^ buf[10];
    // Column 1 parity: protects Interaction bitmask (Byte 13)
    buf[15] = buf[1] ^ buf[5] ^ buf[9] ^ buf[13];
  }

  /**
   * Verify that both safety codes are consistent with the payload.
   * Returns true if the matrix is intact.
   */
  static verify(buf: Uint8Array): boolean {
    const check14 = buf[2] ^ buf[6] ^ buf[10];
    const check15 = buf[1] ^ buf[5] ^ buf[9] ^ buf[13];
    return buf[14] === check14 && buf[15] === check15;
  }

  /**
   * Recover a corrupted field using the orthogonal XOR parity.
   *
   * @param buf   - The received 16-byte buffer (mutated in place).
   * @param field - Which byte was lost.
   * @returns The recovered value.
   */
  static recover(buf: Uint8Array, field: CorruptedField): number {
    switch (field) {
      case CorruptedField.VertexColorC:
        buf[2] = buf[6] ^ buf[10] ^ buf[14];
        return buf[2];

      case CorruptedField.Interaction:
        buf[13] = buf[1] ^ buf[5] ^ buf[9] ^ buf[15];
        return buf[13];

      case CorruptedField.None:
      default:
        return 0;
    }
  }

  /**
   * Attempt automatic dual-field recovery.  This handles the worst case
   * where both Column 2 (visual color) and Column 1 (interaction) are
   * corrupted simultaneously.
   *
   * Because the two safety codes protect orthogonal columns, recovery
   * is fully independent — no iterative solving required.
   */
  static recoverDual(buf: Uint8Array): { colorC: number; interaction: number } {
    const colorC      = buf[6] ^ buf[10] ^ buf[14];
    const interaction = buf[1] ^ buf[5]  ^ buf[9]  ^ buf[15];
    buf[2]  = colorC;
    buf[13] = interaction;
    return { colorC, interaction };
  }
}
