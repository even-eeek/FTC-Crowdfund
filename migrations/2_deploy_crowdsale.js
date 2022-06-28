const FtcToken = artifacts.require("./FtcToken.sol");
const FtcTokenCrowdsale = artifacts.require("./FtcTokenCrowdsale.sol");

module.exports = async function(deployer, network, accounts) {

  const _name = "Forgotten Coin";
  const _symbol = "FTC";
  const _decimals = 18;
  const _supply = 1000000000;

  await deployer.deploy(FtcToken, _name, _symbol, _decimals, _supply);

  const deployedToken = await FtcToken.deployed();

  
  const _token                       = deployedToken.address;
  const _wallet                      = '0xb08A68Dc435ca70bDe807232D30C4550C182b76E';
  const _nextype                     = '0x8d293D1a065dF393823e6ccB3F9Da24D81b3f5Bb';

  await deployer.deploy(
    FtcTokenCrowdsale,
    _wallet,
    _token,
    _nextype
  );

  return true;
};
