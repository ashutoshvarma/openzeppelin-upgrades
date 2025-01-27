const assert = require('assert');

const { deployBeacon, deployBeaconProxy, upgradeBeacon, loadProxy } = require('@openzeppelin/truffle-upgrades');

const GreeterBeaconImpl = artifacts.require('GreeterBeaconImpl');
const GreeterV2 = artifacts.require('GreeterV2');
const GreeterV3 = artifacts.require('GreeterV3');

const TX_HASH_MISSING = 'transaction hash is missing';

contract('GreeterBeaconImpl', function () {
  it('deployBeaconProxy with addresses', async function () {
    const greeterBeacon = await deployBeacon(GreeterBeaconImpl);
    assert.ok(greeterBeacon.transactionHash, TX_HASH_MISSING);
    const greeter = await deployBeaconProxy(greeterBeacon, ['Hello Truffle']);
    assert.ok(greeter.transactionHash, TX_HASH_MISSING);
    assert.notEqual(greeter.transactionHash, greeterBeacon.transactionHash);
    assert.equal(await greeter.greet(), 'Hello Truffle');

    const greeterSecond = await deployBeaconProxy(greeterBeacon.address, ['Hello Truffle second']);
    assert.ok(greeterSecond.transactionHash, TX_HASH_MISSING);
    assert.notEqual(greeterSecond.transactionHash, greeter.transactionHash);
    assert.equal(await greeterSecond.greet(), 'Hello Truffle second');

    const greeterBeaconDuplicate = await deployBeacon(GreeterBeaconImpl);
    const greeterThird = await deployBeaconProxy(greeterBeaconDuplicate.address, ['Hello Truffle third']);
    assert.ok(greeterThird.transactionHash, TX_HASH_MISSING);
    assert.notEqual(greeterThird.transactionHash, greeterSecond.transactionHash);
    assert.equal(await greeterThird.greet(), 'Hello Truffle third');

    //  new impl
    const upgradedBeacon = await upgradeBeacon(greeterBeacon, GreeterV2);
    assert.ok(upgradedBeacon.transactionHash, TX_HASH_MISSING);
    assert.notEqual(upgradedBeacon.transactionHash, greeterBeacon.transactionHash);

    const upgradedBeaconDuplicate = await upgradeBeacon(greeterBeaconDuplicate.address, GreeterV3);
    assert.ok(upgradedBeaconDuplicate.transactionHash, TX_HASH_MISSING);
    assert.notEqual(upgradedBeaconDuplicate.transactionHash, upgradedBeacon.transactionHash);

    // reload proxy to work with the new contract
    const greeter2 = await loadProxy(greeter);
    assert.equal(await greeter2.greet(), 'Hello Truffle');
    await greeter2.resetGreeting();
    assert.equal(await greeter2.greet(), 'Hello World');

    // reload proxy to work with the new contract
    const greeterSecond2 = await loadProxy(greeterSecond.address);
    assert.equal(await greeterSecond2.greet(), 'Hello Truffle second');
    await greeterSecond2.resetGreeting();
    assert.equal(await greeterSecond2.greet(), 'Hello World');

    // reload proxy to work with the new contract
    const greeterThird2 = await loadProxy(greeterThird.address);
    assert.equal(await greeterThird2.greet(), 'Hello Truffle third');
    await greeterThird2.resetGreeting();
    assert.equal(await greeterThird2.greet(), 'Hello World');
    const version3 = await greeterThird2.version();
    assert.equal(version3, 'V3');
  });
});
