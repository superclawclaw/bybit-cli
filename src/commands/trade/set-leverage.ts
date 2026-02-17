import type { RestClientV5 } from 'bybit-api';
import { formatJson } from '../../cli/output.js';
import { toSymbol } from './shared.js';

export interface SetLeverageParams {
  readonly coin: string;
  readonly leverage: string;
  readonly category: string;
  readonly jsonOutput: boolean;
}

export async function setLeverage(
  client: RestClientV5,
  params: SetLeverageParams,
): Promise<void> {
  const symbol = toSymbol(params.coin, params.category);

  const response = await client.setLeverage({
    category: params.category as 'linear' | 'inverse',
    symbol,
    buyLeverage: params.leverage,
    sellLeverage: params.leverage,
  });

  if (response.retCode !== 0) {
    // retCode 110043 = "Set leverage not modified" (already at this leverage)
    if (response.retCode === 110043) {
      const msg = `Leverage already set to ${params.leverage}x for ${symbol}.`;
      if (params.jsonOutput) {
        console.log(formatJson({ symbol, leverage: params.leverage, message: msg }));
      } else {
        console.log(msg);
      }
      return;
    }
    console.error(`Set leverage failed: ${response.retMsg}`);
    return;
  }

  if (params.jsonOutput) {
    console.log(formatJson({ symbol, leverage: params.leverage }));
    return;
  }

  console.log(`Leverage set to ${params.leverage}x for ${symbol}.`);
}
