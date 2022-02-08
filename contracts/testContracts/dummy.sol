
pragma solidity ^0.8.0;
import "hardhat/console.sol";
contract test1 {
    uint[][] public rates = [
    [60, 50, 40],
    [70, 90, 80],
    [100, 120, 140]
    ];

    function GetFrxstRates() public view returns (uint[][] memory) {
        return rates;
    }

    function SetFrxstRates(uint[][] memory _rates) public  {
        rates = _rates;
    }
}