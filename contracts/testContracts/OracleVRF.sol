////SPDX-License-Identifier: UNLICENSED
//
//pragma solidity ^0.8.0;
//
//import "./IOracle.sol";
//import "./Ownable.sol";
//
//contract TimestampVRF is Ownable{
//
//    IOracle Oracle;
//
//    constructor(address oracleAddress){
//        Oracle = IOracle(oracleAddress);
//    }
//
//    function setOracle(address oracleAddress) external onlyOwner{
//        Oracle = IOracle(oracleAddress);
//    }
//
//    // Changes made for testnet testing
//
//    function getCurrentIndex() external view returns(uint){
//        bytes32 tellorId = 0x0000000000000000000000000000000000000000000000000000000000000001;
//        return Oracle.getTimestampCountById(tellorId);
//    }
//
//    function initiateRandomness(uint _tokenId,uint _index) external view returns(uint) {
//        bytes32 tellorId = 0x0000000000000000000000000000000000000000000000000000000000000001;
//        uint result = Oracle.getTimestampCountById(tellorId);
//        if(result<=_index){
//            return 0;
//        }
//        uint tellorTimeStamp = Oracle.getReportTimestampByIndex(tellorId,_index);
//        bytes memory tellorValue = Oracle.getValueByTimestamp(tellorId,tellorTimeStamp);
//        return uint(keccak256(abi.encodePacked(tellorValue,_tokenId)));
//    }
//
//}