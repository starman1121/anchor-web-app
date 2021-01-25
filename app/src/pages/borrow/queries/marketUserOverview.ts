import { useSubscription } from '@anchor-protocol/broadcastable-operation';
import { Num, uUST } from '@anchor-protocol/notation';
import { useWallet } from '@anchor-protocol/wallet-provider';
import { gql, QueryResult, useQuery } from '@apollo/client';
import { useAddressProvider } from 'contexts/contract';
import { useMemo } from 'react';
import { Data as MarketBalanceOverviewData } from './marketBalanceOverview';

export interface StringifiedData {
  loanAmount: {
    Result: string;
  };

  liability: {
    Result: string;
  };

  borrowInfo: {
    Result: string;
  };
}

export interface Data {
  loanAmount: {
    borrower: string;
    loan_amount: uUST<string>;
  };

  liability: {
    borrower: string;
    loan_amount: uUST<string>;
    interest_index: Num<string>;
  };

  borrowInfo: {
    borrower: string;
    balance: uUST<string>;
    spendable: uUST<string>;
  };
}

export function parseData({
  loanAmount,
  liability,
  borrowInfo,
}: StringifiedData): Data {
  return {
    loanAmount: JSON.parse(loanAmount.Result),
    liability: JSON.parse(liability.Result),
    borrowInfo: JSON.parse(borrowInfo.Result),
  };
}

export interface StringifiedVariables {
  marketContractAddress: string;
  marketLoanQuery: string;
  marketLiabilityQuery: string;
  custodyContractAddress: string;
  custodyBorrowerQuery: string;
}

export interface Variables {
  marketContractAddress: string;
  marketLoanQuery: {
    loan_amount: {
      borrower: string;
      block_height: number;
    };
  };
  custodyContractAddress: string;
  custodyBorrowerQuery: {
    borrower: {
      address: string;
    };
  };
}

export function stringifyVariables({
  marketContractAddress,
  marketLoanQuery,
  custodyContractAddress,
  custodyBorrowerQuery,
}: Variables): StringifiedVariables {
  return {
    marketContractAddress,
    marketLoanQuery: JSON.stringify(marketLoanQuery),
    marketLiabilityQuery: JSON.stringify({
      liability: {
        borrower: marketLoanQuery.loan_amount.borrower,
      },
    }),
    custodyContractAddress,
    custodyBorrowerQuery: JSON.stringify(custodyBorrowerQuery),
  };
}

export const query = gql`
  query(
    $marketContractAddress: String!
    $marketLoanQuery: String!
    $marketLiabilityQuery: String!
    $custodyContractAddress: String!
    $custodyBorrowerQuery: String!
  ) {
    loanAmount: WasmContractsContractAddressStore(
      ContractAddress: $marketContractAddress
      QueryMsg: $marketLoanQuery
    ) {
      Result
    }

    liability: WasmContractsContractAddressStore(
      ContractAddress: $marketContractAddress
      QueryMsg: $marketLiabilityQuery
    ) {
      Result
    }

    borrowInfo: WasmContractsContractAddressStore(
      ContractAddress: $custodyContractAddress
      QueryMsg: $custodyBorrowerQuery
    ) {
      Result
    }
  }
`;

export function useMarketUserOverview({
  marketBalance,
}: {
  marketBalance: MarketBalanceOverviewData | undefined;
}): QueryResult<StringifiedData, StringifiedVariables> & {
  parsedData: Data | undefined;
} {
  const addressProvider = useAddressProvider();
  const { status } = useWallet();

  const result = useQuery<StringifiedData, StringifiedVariables>(query, {
    skip: status.status !== 'ready' || !marketBalance,
    fetchPolicy: 'cache-and-network',
    variables: stringifyVariables({
      marketContractAddress: addressProvider.market('uusd'),
      marketLoanQuery: {
        loan_amount: {
          borrower: status.status === 'ready' ? status.walletAddress : '',
          block_height: marketBalance?.currentBlock ?? 0,
        },
      },
      custodyContractAddress: addressProvider.custody('ubluna'),
      custodyBorrowerQuery: {
        borrower: {
          address: status.status === 'ready' ? status.walletAddress : '',
        },
      },
    }),
  });

  useSubscription((id, event) => {
    if (event === 'done') {
      result.refetch();
    }
  });

  const parsedData = useMemo(
    () => (result.data ? parseData(result.data) : undefined),
    [result.data],
  );

  return {
    ...result,
    parsedData,
  };
}
