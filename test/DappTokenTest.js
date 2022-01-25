var DappToken = artifacts.require("DappToken");

contract('DappToken', accounts => {

    it('initializes the contract with correct values', async () => {
        let instance = await DappToken.deployed();
        var name = await instance.name();
        assert.equal(name, 'DApp Token', 'has the correct name');
        var symbol = await instance.symbol();
        assert.equal(symbol, 'DAPP', 'has the correct symbol');
        var standard = await instance.standard();
        assert.equal(standard, 'DApp Token v1.0', 'has the correct standard');
    })
    
    it('allocates the initial supply upon deplyoment', async () => {
        let instance = await DappToken.deployed();
        var Supply = await instance.totalSupply();
        assert.equal(Supply.toNumber(), 1000000, 'sets the total supply to 1000000'); 
        let adminBalance = await instance.balanceOf(accounts[0]);
        assert.equal(adminBalance.toNumber(), 1000000, 'it allocates the initial supply to the admin'); 
    })

    it('transfers token ownership', async () => {
        let instance = await DappToken.deployed();
        try {
            let fail = await instance.transfer.call(accounts[1], 1);
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }
        let success = await instance.transfer.call(accounts[1], 1, {from : accounts[0] });
        assert.equal(success, true, 'it return true');
        let receipt = await instance.transfer(accounts[1], 250000, {from : accounts[0] });
        assert.equal(receipt.logs.length, 1, 'triggers one event');
        assert.equal(receipt.logs[0].event, 'Transfer', 'should be transfer event');
        assert.equal(receipt.logs[0].args._from, accounts[0], 'logs the account the tokens are transferred from');
        assert.equal(receipt.logs[0].args._to, accounts[1], 'logs the account the tokens are transferred to');
        assert.equal(receipt.logs[0].args._value, 250000, 'logs the transfer amount');
        let balance1 = await instance.balanceOf(accounts[1]);
        assert.equal(balance1.toNumber(), 250000, 'adds the amount to the receivig account');
        let balance0 = await instance.balanceOf(accounts[0]);
        assert.equal(balance0.toNumber(), 750000, 'deducts the amount from the sending account');
    })

    it('approves tokens for delegated transfers', async () => {
        let instance = await DappToken.deployed();
        let success = await instance.approve.call(accounts[1], 100);
        assert.equal(success, true, 'it return true');

        let receipt = await instance.approve(accounts[1], 100);
        assert.equal(receipt.logs.length, 1, 'triggers one event');
        assert.equal(receipt.logs[0].event, 'Approval', 'should be Approval event');
        assert.equal(receipt.logs[0].args._owner, accounts[0], 'logs the account the tokens are authorized by');
        assert.equal(receipt.logs[0].args._spender, accounts[1], 'logs the account the tokens are authorized to');
        assert.equal(receipt.logs[0].args._value, 100, 'logs the transfer amount');

        let allowance = await instance.allowance(accounts[0], accounts[1]);
        assert.equal(allowance, 100, 'stores the allowance for delegated transfer');
    })

    it('handles delegated token transfer', async () => {
        let instance = await DappToken.deployed();
        let fromAccount = accounts[2];
        let toAccount = accounts[3];
        let spendingAccount = accounts[4];
        //Transfer to frommAccount some amount, so that it can be sued
        await instance.transfer(fromAccount, 100, {from : accounts[0]});
        //approve spendingaccount to spend 10 tokens from fromaccount
        let approve = await instance.approve(spendingAccount, 10, {from : fromAccount});
        //Try transferring something larger than the senders balance
        try {
            await instance.transferFrom(fromAccount, toAccount, 9999, {from:spendingAccount});
            assert.fail();
        } catch (err) {
            assert(err.message.indexOf('revert') >= 0, 'cannot transfer value larger than balance');
        }
        //try transferring something larger than approved amount
        try {
            await instance.transferFrom(fromAccount, toAccount, 20, {from:spendingAccount});
            assert.fail();
        } catch (err) {
            assert(err.message.indexOf('revert') >= 0, 'cannot transfer value larger than approved amount');
        }

        let success = await instance.transferFrom.call(fromAccount, toAccount, 10, {from:spendingAccount});
        assert.equal(success, true, 'it return true');

        let receipt = await instance.transferFrom(fromAccount, toAccount, 10, {from:spendingAccount});
        assert.equal(receipt.logs.length, 1, 'triggers one event');
        assert.equal(receipt.logs[0].event, 'Transfer', 'should be transfer event');
        assert.equal(receipt.logs[0].args._from, fromAccount, 'logs the account the tokens are transferred from');
        assert.equal(receipt.logs[0].args._to, toAccount, 'logs the account the tokens are transferred to');
        assert.equal(receipt.logs[0].args._value, 10, 'logs the transfer amount');

        let fromBalance = await instance.balanceOf(fromAccount);
        assert.equal(fromBalance.toNumber(), 90, 'deducts the amount from the sending account');

        let toBalance = await instance.balanceOf(toAccount);
        assert.equal(toBalance.toNumber(), 10, 'adds the amount from the receiving account');

        let allowance = await instance.allowance(fromAccount, spendingAccount);
        assert.equal(allowance.toNumber(), 0, 'adds the amount from the allowance');
    })    
});