import {
  microfy,
  Ratio,
  uaUST,
  ubLuna,
  uLuna,
  UST,
  uUST,
} from '@anchor-protocol/notation';
import { useWallet } from '@anchor-protocol/wallet-provider';
import { BigSource } from 'big.js';
import { Data as TaxData, useTax } from 'queries/tax';
import {
  Data as UserBalancesData,
  useUserBalances,
} from 'queries/userBalances';
import type { ReactNode } from 'react';
import {
  Consumer,
  Context,
  createContext,
  useContext,
  useEffect,
  useMemo,
} from 'react';

export interface BankProviderProps {
  children: ReactNode;
}

export interface Bank {
  status: 'demo' | 'connected';
  tax: TaxData;
  refetchTax: () => void;
  userBalances: UserBalancesData;
  refetchUserBalances: () => void;
}

// @ts-ignore
const BankContext: Context<Bank> = createContext<Bank>();

export function BankProvider({ children }: BankProviderProps) {
  const { status } = useWallet();

  const { parsedData: taxData, refetch: refetchTax } = useTax();

  const {
    parsedData: userBalancesData,
    refetch: refetchUserBalances,
  } = useUserBalances();

  const state = useMemo<Bank>(() => {
    return status.status === 'ready' && !!taxData && !!userBalancesData
      ? {
          status: 'connected',
          tax: taxData,
          refetchTax,
          userBalances: userBalancesData,
          refetchUserBalances,
        }
      : {
          status: 'demo',
          tax: taxData
            ? taxData
            : {
                taxRate: '0.1' as Ratio,
                maxTaxUUSD: microfy(0.1 as UST<BigSource>).toString() as uUST,
              },
          refetchTax,
          userBalances: {
            uUSD: '0' as uUST,
            uLuna: '0' as uLuna,
            ubLuna: '0' as ubLuna,
            uaUST: '0' as uaUST,
          },
          refetchUserBalances,
        };
  }, [
    refetchTax,
    refetchUserBalances,
    status.status,
    taxData,
    userBalancesData,
  ]);

  useEffect(() => {
    refetchTax();

    if (status.status === 'ready') {
      refetchUserBalances();
    }
  }, [refetchTax, refetchUserBalances, status.status]);

  return <BankContext.Provider value={state}>{children}</BankContext.Provider>;
}

export function useBank(): Bank {
  return useContext(BankContext);
}

export const BankConsumer: Consumer<Bank> = BankContext.Consumer;
