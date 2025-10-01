import type {
  Address,
  ContractFunctionArgs,
  ContractFunctionName,
  ContractFunctionReturnType,
  Hex,
  PublicClient,
  Transport,
  WalletClient,
} from 'viem';
import { decodeFunctionResult, encodeFunctionData } from 'viem';
import { stakingAbi, type MonadStakingAbi } from '../abi.js';
import type { MonadStakingSdkOptions } from '../types/sdk.js';
import { assertSameChain } from '../validation/index.js';

type FunctionName = Extract<MonadStakingAbi[number], { type: 'function' }>['name'];
type AnyStateMutability = 'nonpayable' | 'payable' | 'view' | 'pure';
type FunctionArgs<TName extends FunctionName> = ContractFunctionArgs<
  MonadStakingAbi,
  AnyStateMutability,
  TName
>;
type FunctionReturn<TName extends FunctionName> = ContractFunctionReturnType<
  MonadStakingAbi,
  AnyStateMutability,
  TName
>;

export abstract class BaseClient<TTransport extends Transport> {
  protected readonly options: MonadStakingSdkOptions<TTransport>;
  protected walletClient?: WalletClient<TTransport>;

  constructor(options: MonadStakingSdkOptions<TTransport>) {
    this.options = options;
    assertSameChain(options.network, options.publicClient.chain?.id, 'public');
    
    if (options.walletClient) {
      assertSameChain(options.network, options.walletClient.chain?.id, 'wallet');
      this.walletClient = options.walletClient;
    }
  }

  get network() {
    return this.options.network;
  }

  get address(): Address {
    return this.options.network.precompileAddress;
  }

  get publicClient(): PublicClient<TTransport> {
    return this.options.publicClient;
  }

  setWalletClient(client: WalletClient<TTransport>): void {
    assertSameChain(this.options.network, client.chain?.id, 'wallet');
    this.walletClient = client;
  }

  protected requireWalletClient(): WalletClient<TTransport> {
    if (!this.walletClient) {
      throw new Error('Wallet client is not configured. Call setWalletClient or provide one during construction.');
    }
    return this.walletClient;
  }

  protected async callFunction<TName extends FunctionName>(
    functionName: TName,
    args: FunctionArgs<TName>,
  ): Promise<FunctionReturn<TName>> {
    const data = encodeFunctionData({
      abi: stakingAbi,
      functionName: functionName as ContractFunctionName<MonadStakingAbi>,
      args: args as ContractFunctionArgs<MonadStakingAbi, AnyStateMutability, ContractFunctionName<MonadStakingAbi>>,
    });

    const { data: raw } = await this.publicClient.call({
      to: this.address,
      data,
    });

    if (!raw) {
      throw new Error(`Call to ${functionName} returned empty data.`);
    }

    return decodeFunctionResult({
      abi: stakingAbi,
      functionName: functionName as ContractFunctionName<MonadStakingAbi>,
      data: raw as Hex,
    }) as FunctionReturn<TName>;
  }
}
