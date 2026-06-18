/**
 * bitmask.ts — 8-bit social interaction state.
 *
 * One byte.  Eight independent boolean switches.  No JSON parsing, no string
 * comparison — a single AND instruction tells you whether the user liked a
 * post.  This is the cheapest possible representation of social state.
 *
 * Bit layout (MSB → LSB):
 *
 *   Bit 7   BLOCKED        User has blocked the author
 *   Bit 6   MUTED          User has muted the author
 *   Bit 5   FOLLOWING      User follows the author
 *   Bit 4   CLOSE_FRIEND   Post is in the close-friends circle
 *   Bit 3   BOOKMARKED     User has bookmarked this post
 *   Bit 2   COMMENTED      User has commented on this post
 *   Bit 1   REPOSTED       User has reposted this post
 *   Bit 0   LIKED          User has liked this post
 */

export interface SocialState {
  liked:        boolean;
  reposted:     boolean;
  commented:    boolean;
  bookmarked:   boolean;
  closeFriend:  boolean;
  following:    boolean;
  muted:        boolean;
  blocked:      boolean;
}

export const enum Mask {
  LIKED        = 0x01,
  REPOSTED     = 0x02,
  COMMENTED    = 0x04,
  BOOKMARKED   = 0x08,
  CLOSE_FRIEND = 0x10,
  FOLLOWING    = 0x20,
  MUTED        = 0x40,
  BLOCKED      = 0x80,
}

export class InteractionBitmask {
  /**
   * Pack a human-readable SocialState object into a single byte.
   * This is the server-side operation.
   */
  static encode(state: SocialState): number {
    let byte = 0;
    if (state.liked)       byte |= Mask.LIKED;
    if (state.reposted)    byte |= Mask.REPOSTED;
    if (state.commented)   byte |= Mask.COMMENTED;
    if (state.bookmarked)  byte |= Mask.BOOKMARKED;
    if (state.closeFriend) byte |= Mask.CLOSE_FRIEND;
    if (state.following)   byte |= Mask.FOLLOWING;
    if (state.muted)       byte |= Mask.MUTED;
    if (state.blocked)     byte |= Mask.BLOCKED;
    return byte;
  }

  /**
   * Unpack a byte into a SocialState object.
   * This is the client-side operation — one AND per flag.
   */
  static decode(byte: number): SocialState {
    return {
      liked:       (byte & Mask.LIKED)        !== 0,
      reposted:    (byte & Mask.REPOSTED)     !== 0,
      commented:   (byte & Mask.COMMENTED)    !== 0,
      bookmarked:  (byte & Mask.BOOKMARKED)   !== 0,
      closeFriend: (byte & Mask.CLOSE_FRIEND) !== 0,
      following:   (byte & Mask.FOLLOWING)    !== 0,
      muted:       (byte & Mask.MUTED)        !== 0,
      blocked:     (byte & Mask.BLOCKED)      !== 0,
    };
  }

  /**
   * Toggle a single flag via bitwise OR (set) or AND-NOT (clear).
   * Returns the updated byte.  No allocation, no branching.
   */
  static toggle(byte: number, mask: Mask, on: boolean): number {
    return on ? byte | mask : byte & ~mask;
  }
}
