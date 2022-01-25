var DappToken = artifacts.require("DappToken");
var DappTokenSale = artifacts.require("DappTokenSale");

contract('DappTokenSale', accounts => {
    var admin = accounts[0];
    var buyer = accounts[1];
    var tokenPrice = 1000000000000000; //in wei
    var tokensAvailable = 750000;
    let numberOfTokens;

    it('initializes the contract with correct values', async () => {
        let instance = await DappTokenSale.deployed();
        let address = instance.address;
        assert.notEqual(address, 0x0, 'has contract address')
        
        let tokenAddress = await instance.tokenContract();
        assert.notEqual(tokenAddress, 0x0, 'has a token contract address')

        let price = await instance.tokenPrice();
        assert.equal(price, tokenPrice, 'token price is correct')
    });

    it('facilitates token buying', async () => {
        let tokenInstance = await DappToken.deployed();
        let tokenSaleInstance = await DappTokenSale.deployed();
        numberOfTokens = 10;

        //provision 75% of all tokens to token sale
        let transferReceipt = await tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, {from : admin});

        let receipt = await tokenSaleInstance.buyTokens(numberOfTokens, {from : buyer, value: numberOfTokens * tokenPrice});
        assert.equal(receipt.logs.length, 1, 'triggers one event');
        assert.equal(receipt.logs[0].event, 'Sell', 'should be sell event');
        assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens');
        assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the number of tokens purchased');
        
        let amount = await tokenSaleInstance.tokenSold();
        assert.equal(amount.toNumber(), numberOfTokens, 'increments the number of tokens sold');

        let balanceOfBuyer = await tokenInstance.balanceOf(buyer);
        assert.equal(balanceOfBuyer.toNumber(), numberOfTokens);
        
        let balance = await tokenInstance.balanceOf(tokenSaleInstance.address);
        assert.equal(balance.toNumber(), tokensAvailable - numberOfTokens);

        //Try to buy tokens different from ether value
        try {
            let receipt = await tokenSaleInstance.buyTokens(numberOfTokens, {from : buyer, value: 1 });
            assert.fail();
        } catch (error) {
            assert(error.message.indexOf('revert') >=0, 'msg.value must equal number of tokens in wei');
        }

        try {
            let receipt = await tokenSaleInstance.buyTokens(800000, {from : buyer, value: numberOfTokens * tokenPrice });
            assert.fail();
        } catch (error) {
            assert(error.message.indexOf('revert') >=0, 'cannot purchase more tokens than available');
        }
    });

    it('ends token sale', async () => {
        let tokenInstance = await DappToken.deployed();
        let tokenSaleInstance = await DappTokenSale.deployed();

        //Try to end sale from account other than the admin
        try {
            await tokenSaleInstance.endSale({from : buyer});
            assert.fail();
        } catch(error) {
            assert(error.message.indexOf('revert') >=0, 'must be admin to end sale');
        }

        //End sale as admin
        let receipt = await tokenSaleInstance.endSale({from : admin});

        let balance = await tokenInstance.balanceOf(admin);
        assert.equal(balance.toNumber(), 999990, 'returns all unsold dapp tokens to admin');

        let Price = await tokenSaleInstance.tokenPrice();
        assert.equal(price.toNumber(), 0, 'token price was reset');
    });
})