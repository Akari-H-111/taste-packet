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
    liked: boolean;
    reposted: boolean;
    commented: boolean;
    bookmarked: boolean;
    closeFriend: boolean;
    following: boolean;
    muted: boolean;
    blocked: boolean;
}
export declare enum Mask {
    LIKED = 1,
    REPOSTED = 2,
    COMMENTED = 4,
    BOOKMARKED = 8,
    CLOSE_FRIEND = 16,
    FOLLOWING = 32,
    MUTED = 64,
    BLOCKED = 128
}
export declare class InteractionBitmask {
    /**
     * Pack a human-readable SocialState object into a single byte.
     * This is the server-side operation.
     */
    static encode(state: SocialState): number;
    /**
     * Unpack a byte into a SocialState object.
     * This is the client-side operation — one AND per flag.
     */
    static decode(byte: number): SocialState;
    /**
     * Toggle a single flag via bitwise OR (set) or AND-NOT (clear).
     * Returns the updated byte without allocating an object.
     */
    static toggle(byte: number, mask: Mask, on: boolean): number;
}
