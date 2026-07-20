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
export class InteractionBitmask {
    /**
     * Pack a human-readable SocialState object into a single byte.
     * This is the server-side operation.
     */
    static encode(state) {
        let byte = 0;
        if (state.liked)
            byte |= 1 /* Mask.LIKED */;
        if (state.reposted)
            byte |= 2 /* Mask.REPOSTED */;
        if (state.commented)
            byte |= 4 /* Mask.COMMENTED */;
        if (state.bookmarked)
            byte |= 8 /* Mask.BOOKMARKED */;
        if (state.closeFriend)
            byte |= 16 /* Mask.CLOSE_FRIEND */;
        if (state.following)
            byte |= 32 /* Mask.FOLLOWING */;
        if (state.muted)
            byte |= 64 /* Mask.MUTED */;
        if (state.blocked)
            byte |= 128 /* Mask.BLOCKED */;
        return byte;
    }
    /**
     * Unpack a byte into a SocialState object.
     * This is the client-side operation — one AND per flag.
     */
    static decode(byte) {
        return {
            liked: (byte & 1 /* Mask.LIKED */) !== 0,
            reposted: (byte & 2 /* Mask.REPOSTED */) !== 0,
            commented: (byte & 4 /* Mask.COMMENTED */) !== 0,
            bookmarked: (byte & 8 /* Mask.BOOKMARKED */) !== 0,
            closeFriend: (byte & 16 /* Mask.CLOSE_FRIEND */) !== 0,
            following: (byte & 32 /* Mask.FOLLOWING */) !== 0,
            muted: (byte & 64 /* Mask.MUTED */) !== 0,
            blocked: (byte & 128 /* Mask.BLOCKED */) !== 0,
        };
    }
    /**
     * Toggle a single flag via bitwise OR (set) or AND-NOT (clear).
     * Returns the updated byte.  No allocation, no branching.
     */
    static toggle(byte, mask, on) {
        return on ? byte | mask : byte & ~mask;
    }
}
