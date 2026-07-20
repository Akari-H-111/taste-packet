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
export var Mask;
(function (Mask) {
    Mask[Mask["LIKED"] = 1] = "LIKED";
    Mask[Mask["REPOSTED"] = 2] = "REPOSTED";
    Mask[Mask["COMMENTED"] = 4] = "COMMENTED";
    Mask[Mask["BOOKMARKED"] = 8] = "BOOKMARKED";
    Mask[Mask["CLOSE_FRIEND"] = 16] = "CLOSE_FRIEND";
    Mask[Mask["FOLLOWING"] = 32] = "FOLLOWING";
    Mask[Mask["MUTED"] = 64] = "MUTED";
    Mask[Mask["BLOCKED"] = 128] = "BLOCKED";
})(Mask || (Mask = {}));
export class InteractionBitmask {
    /**
     * Pack a human-readable SocialState object into a single byte.
     * This is the server-side operation.
     */
    static encode(state) {
        let byte = 0;
        if (state.liked)
            byte |= Mask.LIKED;
        if (state.reposted)
            byte |= Mask.REPOSTED;
        if (state.commented)
            byte |= Mask.COMMENTED;
        if (state.bookmarked)
            byte |= Mask.BOOKMARKED;
        if (state.closeFriend)
            byte |= Mask.CLOSE_FRIEND;
        if (state.following)
            byte |= Mask.FOLLOWING;
        if (state.muted)
            byte |= Mask.MUTED;
        if (state.blocked)
            byte |= Mask.BLOCKED;
        return byte;
    }
    /**
     * Unpack a byte into a SocialState object.
     * This is the client-side operation — one AND per flag.
     */
    static decode(byte) {
        return {
            liked: (byte & Mask.LIKED) !== 0,
            reposted: (byte & Mask.REPOSTED) !== 0,
            commented: (byte & Mask.COMMENTED) !== 0,
            bookmarked: (byte & Mask.BOOKMARKED) !== 0,
            closeFriend: (byte & Mask.CLOSE_FRIEND) !== 0,
            following: (byte & Mask.FOLLOWING) !== 0,
            muted: (byte & Mask.MUTED) !== 0,
            blocked: (byte & Mask.BLOCKED) !== 0,
        };
    }
    /**
     * Toggle a single flag via bitwise OR (set) or AND-NOT (clear).
     * Returns the updated byte without allocating an object.
     */
    static toggle(byte, mask, on) {
        return on ? byte | mask : byte & ~mask;
    }
}
