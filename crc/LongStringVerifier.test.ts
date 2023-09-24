import { LongStringVerifier } from './LongStringVerifier';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate } from 'snarkyjs';
import { crc32 } from 'crc';

/*
 * This file specifies how to test the `LongStringVerifier` smart contract.
 */

let proofsEnabled = false;

describe('LongStringVerifier', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    senderAccount: PublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: LongStringVerifier;

  beforeAll(async () => {
    if (proofsEnabled) await LongStringVerifier.compile();
  });

  beforeEach(() => {
    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } =
      Local.testAccounts[0]);
    ({ privateKey: senderKey, publicKey: senderAccount } =
      Local.testAccounts[1]);
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new LongStringVerifier(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('generates and deploys the `LongStringVerifier` smart contract', async () => {
    await localDeploy();
    const crc = zkApp.crc.get();
    expect(crc).toEqual(Field(0));
  });

  it('correctly updates the crc state on the `LongStringVerifier` smart contract', async () => {
    await localDeploy();
    const validationString = 'arbitrarily long validation string';

    // update transaction
    const txn = await Mina.transaction(senderAccount, () => {
      const localCrc = crc32(validationString);
      zkApp.setCrc(Field(localCrc));
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const updatedNum = zkApp.crc.get();
    expect(updatedNum).toEqual(Field(crc32(validationString)));
  });
});
