import { gql } from "graphql-request";

export const getSenderTransactionsQuery = gql`
  query GetSenderTransactions($userId: String!, $sendingChainId: BigInt!, $status: TransactionStatus) {
    transactions(
      where: { user: $userId, status: $status, sendingChainId: $sendingChainId }
      orderBy: preparedBlockNumber
      orderDirection: desc
    ) {
      id
      status
      chainId
      preparedTimestamp
      user {
        id
      }
      router {
        id
      }
      initiator
      receivingChainTxManagerAddress
      sendingAssetId
      receivingAssetId
      sendingChainFallback
      receivingAddress
      callTo
      sendingChainId
      receivingChainId
      callDataHash
      transactionId
      amount
      expiry
      preparedBlockNumber
      encryptedCallData
      encodedBid
      bidSignature
      prepareCaller
      fulfillCaller
      cancelCaller
      prepareTransactionHash
      fulfillTransactionHash
      cancelTransactionHash
      encodedConditionData
      fulfillUnlockData
      cancelUnlockData
      sendingChainCondition
      receivingChainCondition
    }
  }
`;

export const getReceiverTransactionsQuery = gql`
  query GetReceiverTransactions($userId: String!, $receivingChainId: BigInt!, $status: TransactionStatus) {
    transactions(
      where: { user: $userId, status: $status, receivingChainId: $receivingChainId }
      orderBy: preparedBlockNumber
      orderDirection: desc
    ) {
      id
      status
      chainId
      preparedTimestamp
      user {
        id
      }
      router {
        id
      }
      initiator
      receivingChainTxManagerAddress
      sendingAssetId
      receivingAssetId
      sendingChainFallback
      receivingAddress
      callTo
      sendingChainId
      receivingChainId
      callDataHash
      transactionId
      amount
      expiry
      preparedBlockNumber
      encryptedCallData
      encodedBid
      bidSignature
      prepareCaller
      fulfillCaller
      cancelCaller
      prepareTransactionHash
      fulfillTransactionHash
      cancelTransactionHash
      encodedConditionData
      fulfillUnlockData
      cancelUnlockData
      sendingChainCondition
      receivingChainCondition
    }
  }
`;

export const getTransactionByIdQuery = gql`
  query GetTransaction($transactionId: ID!) {
    transaction(id: $transactionId) {
      id
      status
      chainId
      preparedTimestamp
      user {
        id
      }
      router {
        id
      }
      initiator
      receivingChainTxManagerAddress
      sendingAssetId
      receivingAssetId
      sendingChainFallback
      receivingAddress
      callTo
      sendingChainId
      receivingChainId
      callDataHash
      transactionId
      amount
      expiry
      preparedBlockNumber
      encryptedCallData
      #
      encodedBid
      bidSignature
      relayerFee
      prepareCaller
      fulfillCaller
      cancelCaller
      prepareTransactionHash
      fulfillTransactionHash
      cancelTransactionHash
      fulfillUnlockData
      cancelUnlockData
      encodedConditionData
      sendingChainCondition
      receivingChainCondition
    }
  }
`;

export const getTransactionsByIdsQuery = gql`
  query GetTransactions($transactionIds: [Bytes!]) {
    transactions(where: { transactionId_in: $transactionIds }) {
      id
      status
      chainId
      preparedTimestamp
      user {
        id
      }
      router {
        id
      }
      initiator
      receivingChainTxManagerAddress
      sendingAssetId
      receivingAssetId
      sendingChainFallback
      receivingAddress
      callTo
      sendingChainId
      receivingChainId
      callDataHash
      transactionId
      amount
      expiry
      preparedBlockNumber
      encryptedCallData
      encodedBid
      bidSignature
      relayerFee
      callData
      prepareCaller
      fulfillCaller
      cancelCaller
      prepareTransactionHash
      fulfillTransactionHash
      cancelTransactionHash
      fulfillUnlockData
      encodedConditionData
      cancelUnlockData
      sendingChainCondition
      receivingChainCondition
    }
  }
`;

export const getBlockNumber = gql`
  query GetBlockNumber {
    _meta {
      block {
        number
      }
    }
  }
`;
