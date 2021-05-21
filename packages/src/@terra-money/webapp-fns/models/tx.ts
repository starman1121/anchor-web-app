export enum TxStreamPhase {
  /** in progress post (wait allow from chrome extension or walletconnect) */
  POST = 'POST',

  /** in progress broadcast (poll txInfo) */
  BROADCAST = 'BROADCAST',

  /** checked txInfo is succeed */
  SUCCEED = 'SUCCEED',

  /** failed POST or BROADCAST */
  FAILED = 'FAILED',
}

export interface TxErrorRendering {
  errorId?: string;
  error: unknown;
}

export interface TxReceipt {
  name: string | JSX.Element;
  value: string | JSX.Element;
}

export interface TxResultRendering<T = unknown> {
  /**
   * @internal
   * pass to next unary function
   * this property not affect to rendering
   */
  value: T;

  phase: TxStreamPhase;

  /**
   * if this is exists,
   * - the tx is failed
   */
  failedReason?: TxErrorRendering;

  /**
   * if this is exists,
   * - the tx is succeed
   * - but, had errors when make receipts
   */
  receiptErrors?: TxErrorRendering[];

  /**
   * tx receipts
   */
  receipts: (TxReceipt | undefined | null | false)[];
}
