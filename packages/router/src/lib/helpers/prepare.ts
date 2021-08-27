import { recoverAuctionBid as _recoverAuctionBid, decodeAuctionBid as _decodeAuctionBid } from "@connext/nxtp-utils";

const EXPIRY_DECREMENT = 3600 * 24;
const ONE_DAY_IN_SECONDS = 3600 * 24;
const ONE_WEEK_IN_SECONDS = 3600 * 24 * 7;

/**
 * Determine if expiry is valid
 *
 * @remarks Should use the latest block of the *receiving* chain
 *
 * @param buffer - The expiry buffer to check validity of
 */
export const validExpiryBuffer = (buffer: number) => buffer > ONE_DAY_IN_SECONDS && buffer < ONE_WEEK_IN_SECONDS;

/**
 * Determine if the bid expiry is valid.
 */
export const validBidExpiry = (bidExpiry: number, currentTime: number) => bidExpiry > currentTime;

/**
 * Returns the expiry - EXPIRY_DECREMENT to ensure the receiving-side transfer expires prior to the sending-side transfer.
 *
 * @param buffer The expiry of the transaction on the sending chain
 * @returns The expiry for the receiving-chain transaction (expires sooner than the sending-chain transaction)
 *
 * @remarks
 * Recieiving chain expires first to force the secret to be revealed on the receiving side before the sending side expires
 */
export const getReceiverExpiryBuffer = (buffer: number): number => {
  const rxExpiry = buffer - EXPIRY_DECREMENT;
  return rxExpiry;
};

/**
 * This is only here to make it easier for sinon mocks to happen in the tests. Otherwise, this is a very dumb thing.
 */
export const recoverAuctionBid = _recoverAuctionBid;

/**
 * This is only here to make it easier for sinon mocks to happen in the tests. Otherwise, this is a very dumb thing.
 */
export const decodeAuctionBid = _decodeAuctionBid;
