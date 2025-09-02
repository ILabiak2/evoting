import { Interface } from 'ethers';

function toAbiArray(mod) {
  const m = mod?.default ?? mod;
  if (Array.isArray(m)) return m;
  if (Array.isArray(m?.abi)) return m.abi;
  return [];
}

export function mergeEventOnlyAbi(mods) {
  const uniq = new Map();
  for (const mod of mods) {
    const abi = toAbiArray(mod);
    for (const frag of abi) {
      if (frag?.type !== 'event') continue;
      const types = (frag.inputs || []).map((i) => i.type).join(',');
      const key = `${frag.name}(${types})|anonymous=${frag.anonymous ? 1 : 0}`;
      if (!uniq.has(key)) uniq.set(key, frag);
    }
  }
  return [...uniq.values()];
}

function buildNamedArgs(parsed) {
  const out = {};
  parsed.fragment.inputs.forEach((inp, i) => {
    const key = inp.name && inp.name.trim() ? inp.name : `arg${i}`;
    out[key] = parsed.args[i]; // ethers v6: positional access
  });
  return out;
}

export async function decodeTxWithUnionAbi({ provider, txHash, unionAbi }) {
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) throw new Error('Transaction not found or still pending.');

  const iface = new Interface(unionAbi);
  const block = await provider.getBlock(receipt.blockNumber);
  const out = [];

  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics, data: log.data });
      const args = buildNamedArgs(parsed);
      out.push({
        address: log.address,
        event: parsed.name,
        args,
        topic0: log.topics[0] || null,
        logIndex: log.index,
        blockNumber: receipt.blockNumber,
        timestamp: block?.timestamp ? Number(block.timestamp) : null,
        txHash: receipt.hash,
        parsed: true,
      });
    } catch {
      out.push({
        address: log.address,
        event: null,
        args: null,
        topic0: log.topics[0] || null,
        data: log.data,
        logIndex: log.index,
        blockNumber: receipt.blockNumber,
        timestamp: block?.timestamp ? Number(block.timestamp) : null,
        txHash: receipt.hash,
        parsed: false,
      });
    }
  }
  return out;
}
