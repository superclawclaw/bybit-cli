import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';
import type { OrderInfo } from '../../../commands/account/orders.js';

interface OrdersTableProps {
  readonly orders: readonly OrderInfo[];
}

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}...` : id;
}

export function OrdersTable({ orders }: OrdersTableProps): React.ReactElement {
  if (orders.length === 0) {
    return (
      <Box paddingX={1}>
        <Text color={theme.muted}>No open orders.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box gap={2}>
        <Text color={theme.header} bold>{'ID'.padEnd(12)}</Text>
        <Text color={theme.header} bold>{'Symbol'.padEnd(12)}</Text>
        <Text color={theme.header} bold>{'Side'.padEnd(6)}</Text>
        <Text color={theme.header} bold>{'Type'.padEnd(8)}</Text>
        <Text color={theme.header} bold>{'Price'.padEnd(12)}</Text>
        <Text color={theme.header} bold>{'Qty'.padEnd(10)}</Text>
        <Text color={theme.header} bold>{'Status'.padEnd(12)}</Text>
      </Box>
      {orders.map((order) => (
        <Box key={order.orderId} gap={2}>
          <Text color={theme.muted}>{shortId(order.orderId).padEnd(12)}</Text>
          <Text>{order.symbol.padEnd(12)}</Text>
          <Text color={order.side === 'Buy' ? theme.profit : theme.loss}>{order.side.padEnd(6)}</Text>
          <Text>{order.orderType.padEnd(8)}</Text>
          <Text>{(order.price || '-').padEnd(12)}</Text>
          <Text>{order.qty.padEnd(10)}</Text>
          <Text color={theme.accent}>{order.orderStatus.padEnd(12)}</Text>
        </Box>
      ))}
    </Box>
  );
}
