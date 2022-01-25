const DappToken = artifacts.require("DappToken");
const DappTokenSale = artifacts.require("DappTokenSale");

module.exports = async function (deployer) {
  await deployer.deploy(DappToken, 1000000);
  //Token price is 0.001 Ether
  var tokenPrice = 1000000000000000; //in wei
  await deployer.deploy(DappTokenSale, DappToken.address, tokenPrice);
};
