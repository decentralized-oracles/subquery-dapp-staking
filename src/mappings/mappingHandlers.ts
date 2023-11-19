import { SubstrateEvent } from "@subql/types";
import { Balance } from "@polkadot/types/interfaces";
import { Codec } from "@polkadot/types/types";
import { DApp, Account, Stake, StakeEvent, Reward } from "../types";

function getDAppId(smartContract: Codec): string {
    const addressJson = JSON.parse(smartContract.toString());
    return addressJson.evm ? addressJson.evm : addressJson.wasm;
}

async function saveDApp(dAppId: string, accountId: string, registered: boolean): Promise<void> {
    let dApp = await DApp.get(dAppId);
    if (!dApp) {
        dApp = new DApp(dAppId);
    }
    dApp.registered = registered;
    dApp.accountId  = accountId;
    await dApp.save();
}

async function ensureDApp(dAppId: string): Promise<void> {
    const dApp = await DApp.get(dAppId);
    if (!dApp) {
        const dApp = new DApp(dAppId);
        await dApp.save();
    }
}

async function ensureAccount(accountId: string): Promise<void> {
    const account = await Account.get(accountId);
    if (!account) {
        const account = new Account(accountId);
        return account.save();
    }
}

async function addStake(dAppId: string, accountId: string, amount: bigint): Promise<void> {
    const stakeId = `${dAppId}-${accountId}`;
    let stake = await Stake.get(stakeId);
    if (stake) {
        stake.totalStake += amount;
    } else {
        stake = new Stake(stakeId, accountId, dAppId, amount);
    }

    // save the updated stake
    return stake.save();
}

async function addReward(dAppId: string, accountId: string, amount: bigint): Promise<void> {
    const rewardId = `${dAppId}-${accountId}`;
    let reward = await Reward.get(rewardId);
    if (reward) {
        reward.totalReward += amount;
    } else {
        reward = new Reward(rewardId, accountId, dAppId, amount);
    }
    return reward.save();
}

export async function registerContract(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, smartContract],
        },
    } = event;

    const dAppId = getDAppId(smartContract);
    const accountId = account.toString();

    await ensureAccount(accountId);
    return saveDApp(dAppId, accountId, true);
}


export async function unregisterContract(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, smartContract],
        },
    } = event;

    const dAppId = getDAppId(smartContract);
    const accountId = account.toString();

    await ensureAccount(accountId);
    return saveDApp(dAppId, accountId, false);
}


export async function bondAndStake(event: SubstrateEvent): Promise<void[]> {
    const {
        event: {
            data: [account, smartContract, balanceOf],
        },
    } = event;

    const amount = (balanceOf as Balance).toBigInt();
    const dAppId = getDAppId(smartContract);
    const accountId = account.toString();

    await Promise.all([
        ensureDApp(dAppId),
        ensureAccount(accountId),
    ]);

    const stakeEvent = new StakeEvent(
        `${event.block.block.header.number.toNumber()}-${event.idx}`,
        accountId,
        dAppId,
        amount,
        event.block.block.header.number.toBigInt()
    );

    return Promise.all([
        stakeEvent.save(),
        addStake(dAppId, accountId, amount)
    ]);
}


export async function unbondAndUnstake(event: SubstrateEvent): Promise<void[]> {
    const {
        event: {
            data: [account, smartContract, balanceOf],
        },
    } = event;

    const amount = (balanceOf as Balance).toBigInt();
    const dAppId = getDAppId(smartContract);
    const accountId = account.toString();

    await Promise.all([
        ensureDApp(dAppId),
        ensureAccount(accountId),
    ]);

    const stakeEvent = new StakeEvent(
        `${event.block.block.header.number.toNumber()}-${event.idx}`,
        accountId,
        dAppId,
        -amount,
        event.block.block.header.number.toBigInt()
    );

    return Promise.all([
        stakeEvent.save(),
        addStake(dAppId, accountId, -amount)
    ]);
}


export async function nominationTransfer(event: SubstrateEvent): Promise<void[]> {
    const {
        event: {
            data: [account, originSmartContract, balanceOf, targetSmartContract],
        },
    } = event;

    const amount = (balanceOf as Balance).toBigInt();
    const accountId = account.toString();
    const originDAppId = getDAppId(originSmartContract);
    const targetDAppId = getDAppId(targetSmartContract);

    await Promise.all([
        ensureDApp(originDAppId),
        await ensureDApp(targetDAppId),
        ensureAccount(accountId),
    ]);

    // save the event
    const originStakeEvent = new StakeEvent(
        `${event.block.block.header.number.toNumber()}-${event.idx}-1`,
        accountId,
        originDAppId,
        -amount,
        event.block.block.header.number.toBigInt()
    );

    const targetStakeEvent = new StakeEvent(
        `${event.block.block.header.number.toNumber()}-${event.idx}-2`,
        accountId,
        targetDAppId,
        amount,
        event.block.block.header.number.toBigInt()
    );

    return Promise.all(
        [
            originStakeEvent.save(),
            targetStakeEvent.save(),
            addStake(originDAppId, accountId, -amount),
            addStake(targetDAppId, accountId, amount)
        ]
    );
}

export async function reward(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, smartContract, era, balanceOf],
        },
    } = event;

    const amount = (balanceOf as Balance).toBigInt();
    const dAppId = getDAppId(smartContract);
    const accountId = account.toString();

    await Promise.all([
        ensureDApp(dAppId),
        ensureAccount(accountId),
    ]);

    return addReward(dAppId, accountId, amount);
}