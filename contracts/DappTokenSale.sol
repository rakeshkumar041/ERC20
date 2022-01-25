// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./DappToken.sol";

contract DappTokenSale {
    address admin;
    DappToken public tokenContract;
    uint public tokenPrice;
    uint public tokenSold;

    event Sell(address _buyer, uint _amount);

    constructor(DappToken _tokenContract, uint _tokenPrice) public {
        admin = msg.sender;
        tokenContract = _tokenContract;
        tokenPrice = _tokenPrice;
    }

    //multiply
    function multiply(uint x, uint y) internal pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x);
    }

    //Buy tokens
    function buyTokens(uint _numberOfTokens) public payable {
        require(msg.value == multiply(_numberOfTokens, tokenPrice));
        require(tokenContract.balanceOf(address(this)) >= _numberOfTokens);
        require(tokenContract.transfer(msg.sender, _numberOfTokens));
       
        tokenSold += _numberOfTokens;

        emit Sell(msg.sender, _numberOfTokens);
    }

    //Ending Token DappTokenSale
    function endSale() public {
        require(msg.sender == admin);
        require(tokenContract.transfer(msg.sender, tokenContract.balanceOf(address(this))));
        //Destroy contract
        selfdestruct(payable(admin));
    }

}