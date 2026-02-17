import { describe, it, expect, vi } from 'vitest';
import {
  transformWalletUpdate,
  transformPositionUpdate,
  transformOrderUpdate,
  type WalletWatchData,
  type PositionWatchData,
  type OrderWatchData,
} from './watch.js';

describe('transformWalletUpdate', () => {
  it('transforms wallet WS update into WalletBalance array', () => {
    const prev: WalletWatchData = [];
    const raw = [
      {
        coin: [
          { coin: 'USDT', equity: '1000', availableToWithdraw: '800', unrealisedPnl: '50' },
          { coin: 'BTC', equity: '0.5', availableToWithdraw: '0.4', unrealisedPnl: '0.01' },
        ],
      },
    ];
    const result = transformWalletUpdate(raw, prev);
    expect(result).toEqual([
      { coin: 'USDT', equity: '1000', availableToWithdraw: '800', unrealisedPnl: '50' },
      { coin: 'BTC', equity: '0.5', availableToWithdraw: '0.4', unrealisedPnl: '0.01' },
    ]);
  });

  it('returns previous data on invalid update', () => {
    const prev: WalletWatchData = [
      { coin: 'USDT', equity: '1000', availableToWithdraw: '800', unrealisedPnl: '0' },
    ];
    const result = transformWalletUpdate('invalid', prev);
    expect(result).toBe(prev);
  });

  it('handles empty coin array', () => {
    const prev: WalletWatchData = [];
    const raw = [{ coin: [] }];
    const result = transformWalletUpdate(raw, prev);
    expect(result).toEqual([]);
  });
});

describe('transformPositionUpdate', () => {
  it('transforms position WS update into PositionInfo array', () => {
    const prev: PositionWatchData = [];
    const raw = [
      {
        symbol: 'BTCUSDT',
        side: 'Buy',
        size: '0.1',
        avgPrice: '85000',
        markPrice: '86000',
        unrealisedPnl: '100',
        leverage: '10',
      },
    ];
    const result = transformPositionUpdate(raw, prev);
    expect(result).toEqual([
      {
        symbol: 'BTCUSDT',
        side: 'Buy',
        size: '0.1',
        entryPrice: '85000',
        markPrice: '86000',
        unrealisedPnl: '100',
        leverage: '10',
      },
    ]);
  });

  it('filters out zero-size positions', () => {
    const prev: PositionWatchData = [];
    const raw = [
      { symbol: 'BTCUSDT', side: 'Buy', size: '0', avgPrice: '0', markPrice: '0', unrealisedPnl: '0', leverage: '10' },
      { symbol: 'ETHUSDT', side: 'Buy', size: '1.5', avgPrice: '3000', markPrice: '3100', unrealisedPnl: '150', leverage: '5' },
    ];
    const result = transformPositionUpdate(raw, prev);
    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe('ETHUSDT');
  });

  it('returns previous data on invalid update', () => {
    const prev: PositionWatchData = [
      { symbol: 'BTCUSDT', side: 'Buy', size: '0.1', entryPrice: '85000', markPrice: '86000', unrealisedPnl: '100', leverage: '10' },
    ];
    const result = transformPositionUpdate(null, prev);
    expect(result).toBe(prev);
  });

  it('handles undefined leverage with fallback', () => {
    const raw = [
      { symbol: 'BTCUSDT', side: 'Buy', size: '0.1', avgPrice: '85000', markPrice: '86000', unrealisedPnl: '100' },
    ];
    const result = transformPositionUpdate(raw, []);
    expect(result[0].leverage).toBe('0');
  });
});

describe('transformOrderUpdate', () => {
  it('transforms order WS update into OrderInfo array', () => {
    const prev: OrderWatchData = [];
    const raw = [
      {
        orderId: 'abc123',
        symbol: 'BTCUSDT',
        side: 'Buy',
        orderType: 'Limit',
        price: '85000',
        qty: '0.01',
        orderStatus: 'New',
        createdTime: '1700000000000',
      },
    ];
    const result = transformOrderUpdate(raw, prev);
    expect(result).toEqual([
      {
        orderId: 'abc123',
        symbol: 'BTCUSDT',
        side: 'Buy',
        orderType: 'Limit',
        price: '85000',
        qty: '0.01',
        orderStatus: 'New',
        createdTime: '1700000000000',
      },
    ]);
  });

  it('merges updates into existing orders by orderId', () => {
    const prev: OrderWatchData = [
      { orderId: 'abc123', symbol: 'BTCUSDT', side: 'Buy', orderType: 'Limit', price: '85000', qty: '0.01', orderStatus: 'New', createdTime: '1700000000000' },
      { orderId: 'def456', symbol: 'ETHUSDT', side: 'Sell', orderType: 'Limit', price: '3000', qty: '1', orderStatus: 'New', createdTime: '1700000001000' },
    ];
    const raw = [
      { orderId: 'abc123', symbol: 'BTCUSDT', side: 'Buy', orderType: 'Limit', price: '85500', qty: '0.01', orderStatus: 'PartiallyFilled', createdTime: '1700000000000' },
    ];
    const result = transformOrderUpdate(raw, prev);
    // Updated order replaces old, untouched orders kept
    expect(result).toHaveLength(2);
    const updated = result.find((o) => o.orderId === 'abc123');
    expect(updated?.orderStatus).toBe('PartiallyFilled');
    expect(updated?.price).toBe('85500');
  });

  it('removes cancelled orders from the list', () => {
    const prev: OrderWatchData = [
      { orderId: 'abc123', symbol: 'BTCUSDT', side: 'Buy', orderType: 'Limit', price: '85000', qty: '0.01', orderStatus: 'New', createdTime: '1700000000000' },
    ];
    const raw = [
      { orderId: 'abc123', symbol: 'BTCUSDT', side: 'Buy', orderType: 'Limit', price: '85000', qty: '0.01', orderStatus: 'Cancelled', createdTime: '1700000000000' },
    ];
    const result = transformOrderUpdate(raw, prev);
    expect(result).toHaveLength(0);
  });

  it('returns previous data on invalid update', () => {
    const prev: OrderWatchData = [
      { orderId: 'abc123', symbol: 'BTCUSDT', side: 'Buy', orderType: 'Limit', price: '85000', qty: '0.01', orderStatus: 'New', createdTime: '1700000000000' },
    ];
    const result = transformOrderUpdate({}, prev);
    expect(result).toBe(prev);
  });
});
