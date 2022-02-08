pragma solidity ^0.8.0;

import "./IERC721Receiver.sol";
import "./Pausable.sol";
import "./Ownable.sol";
import "./testYetiTown.sol";
import "./testFRXST.sol";
import "./testRarityStorage.sol";
import "./Timestamp.sol";
import "./IVRF.sol";
import "./Whitelist.sol";
import "hardhat/console.sol";

contract testGameLogic is Pausable, Ownable,IERC721Receiver,rarityCheck {

    testYetiTown public yeti;
    testFRXST public frxst;
    testRarityStorage public rs;
    IVRF public RandomnessEngine;
    address treasury;

    struct Stake {
        uint16 tokenId;
        uint80 value;// last claim
        uint8 activityId;
        address owner;
        uint80 stakeTime; //last staked
    }

    struct InjuryStake {
        uint16 tokenId;
        uint80 value;
        address owner;
    }

    struct initGame {
        uint randomValue;
    }

    event TokenStaked(address owner, uint tokenId, uint8 activityId, uint value);
    event YetiClaimed(uint tokenId, uint earned, bool unstaked);
    event Injury(uint tokenId, uint80 injuredblock);
    event Stolen(uint tokenId);
    event Healing(uint tokenId, address healer, uint cost);

    mapping (uint => bool) public initiateGame;
    mapping(uint => Stake) public palace;
    mapping(uint => Stake) public fighters;
    Stake[] public fighterArray;
    mapping(uint => uint) public fighterIndices;
    mapping (uint => initGame)public randomIndex;
    mapping(uint => InjuryStake) public hospital;


    mapping(uint => uint) public experience;
    mapping(uint => uint8) public levels;

    uint public MINIMUM_TO_EXIT = 10 seconds;
    uint public INJURY_TIME = 10 seconds;

    uint public GENERAL_FRXST_TAX_PERCENTAGE = 10;
    uint public GATHERING_FRXST_TAX_PERCENTAGE = 50;

    uint public GATHERING_TAX_RISK_PERCENTAGE = 50;
    uint public HUNTING_INJURY_RISK_PERCENTAGE = 50;
    uint public FIGHTING_STOLEN_RISK_PERCENTAGE = 10;

    uint public HEALING_COST = 500 * 1e18;
    uint public LEVEL_UP_COST_MULTIPLIER = 100;
    uint public totalFrxstEarned = 0;

    uint public totalYetiStakedGathering;
    uint public totalYetiStakedHunting;
    uint public totalYetiStakedFighting;

    uint[][] public rates = [
    [60, 50, 40],
    [70, 90, 80],
    [100, 120, 140]
    ];

    uint[] public exprates = [2,42,6];//changes made here 3->31

    bool public rescueEnabled = false;

    //Rarity
    mapping(uint256 => uint256) public tokenRarity;
    address designatedSigner = 0x2141fc90F4d8114e8778447d7c19b5992F6A0611;

    event Log(address, uint16, uint8);

    constructor(address _yeti, address _frxst, address _treasury, address _rs,address _vrf) {
        yeti = testYetiTown(_yeti);
        frxst = testFRXST(_frxst);
        treasury = _treasury;
        rs = testRarityStorage(_rs);
        RandomnessEngine = IVRF(_vrf);
    }

    function setVRF (address _vrf) external onlyOwner {
        RandomnessEngine = IVRF(_vrf);
    }

    // Call from Others
    function GetYetiRarity(uint tokenId) public view returns (uint) {
        return tokenRarity[tokenId];
    }

    function GetYetiOwner(uint tokenId) public view returns (address) {
        return yeti.ownerOf(tokenId);
    }

    // Getters
    function GetYetiInPalace(uint tokenId) public view returns (Stake memory) {
        return palace[tokenId];
    }

    function GetYetiInHospital(uint tokenId) public view returns (InjuryStake memory) {
        return hospital[tokenId];
    }

    function GetGeneralTaxPercentage() public view returns (uint) {
        return GENERAL_FRXST_TAX_PERCENTAGE;
    }

    function GetInjuryRiskPercentage() public view returns (uint) {
        return HUNTING_INJURY_RISK_PERCENTAGE;
    }

    function GetStealChance() public view returns (uint) {
        return FIGHTING_STOLEN_RISK_PERCENTAGE;
    }

    function GetLevelUpCostMultiplier() public view returns (uint) {
        return LEVEL_UP_COST_MULTIPLIER;
    }

    function GetExpRates() public view returns (uint[] memory) {
        return exprates;
    }

    function GetFrxstRates() public view returns (uint[][] memory) {
        return rates;
    }

    function GetInjuryTime() public view returns (uint) {
        return INJURY_TIME;
    }

    function GetMinimumClaimTime() public view returns (uint) {
        return MINIMUM_TO_EXIT;
    }

    function GetHealingCost() public view returns (uint) {
        return LEVEL_UP_COST_MULTIPLIER;
    }

    function GetGatherTaxPercentage() public view returns (uint) {
        return GATHERING_FRXST_TAX_PERCENTAGE;
    }

    function GetLevel(uint tokenId) public view returns (uint8) {
        return levels[tokenId];
    }

    function GetLevelModifier(uint8 level) public pure returns (uint) {
        return level + 10;
    }

    function GetExperience(uint tokenId) public view returns (uint) {
        return experience[tokenId];
    }

    function GetTotalYetiStaked() public view returns (uint) {
        return totalYetiStakedGathering + totalYetiStakedHunting + totalYetiStakedFighting;
    }
    function GetRescueEnabled() public view returns (bool) {
        return rescueEnabled;
    }

    // Setters
    function SetFrxstRates(uint[][] memory _rates) public onlyOwner {
        rates = _rates;
    }
    function SetGeneralTaxPercentage(uint _tax) external onlyOwner {
        GENERAL_FRXST_TAX_PERCENTAGE = _tax;
    }
    function SetGatherTaxPercentage(uint _tax) external onlyOwner {
        GATHERING_FRXST_TAX_PERCENTAGE = _tax;
    }
    function SetHuntingInjuryPercentage(uint _injuryrisk) external onlyOwner {
        HUNTING_INJURY_RISK_PERCENTAGE = _injuryrisk;
    }
    function SetFightingStealPercentage(uint _stealrisk) external onlyOwner {
        FIGHTING_STOLEN_RISK_PERCENTAGE = _stealrisk;
    }
    function SetLevelUpCostMultiplier(uint _multiplier) external onlyOwner {
        LEVEL_UP_COST_MULTIPLIER = _multiplier;
    }
    function SetExpRates(uint[] memory _exprates) external onlyOwner {
        exprates = _exprates;
    }

    function SetDesignatedSigner(address newSigner) external onlyOwner{
        designatedSigner = newSigner;
    }

    // In days
    function SetInjuryTime(uint _seconds) external onlyOwner {
        INJURY_TIME = _seconds;
    }
    // In days
    function SetMinimumClaimTime(uint _seconds) external onlyOwner {
        MINIMUM_TO_EXIT = _seconds;
    }

    // In ether
    function SetHealingCost(uint _healingcost) external onlyOwner {
        LEVEL_UP_COST_MULTIPLIER = _healingcost * 1e18;
    }

    function SetRescueEnabled(bool _rescue) external onlyOwner {
        rescueEnabled = _rescue;
    }
    // Game Functionality
    function _addExp(uint tokenId, uint amount) internal {
        experience[tokenId] += amount;
    }

    bytes32 public getSignerStore;

    function initiateGameAt (Rarity[] memory rarity) external {
        for (uint i=0; i<rarity.length;i++) {
            Rarity memory currentRarity = rarity[i];
            getSignerStore = _hash(rarity[i]);
            require (getSigner(currentRarity) == designatedSigner,"Not valid signer");
            tokenRarity[currentRarity.tokenId] = currentRarity.rarityIndex;
            initiateGame[currentRarity.tokenId] = true;
        }
    }

    function levelup(uint tokenId) external whenNotPaused {
        require (initiateGame[tokenId]==true,'Game Not Initiated');
        require(fighters[tokenId].tokenId != tokenId, "Can't level up while fighting");
        require(palace[tokenId].tokenId != tokenId, "Can't level up while staked");
        require(hospital[tokenId].tokenId != tokenId, "Can't level up while injured");
//        require(experience[tokenId] > _nextLevelExp(levels[tokenId]), "Not enough experience");
        require(levels[tokenId] > 0 && levels[tokenId] < 10, "Can exceed level ran");
        //changes made here
//        require(frxst.balanceOf(msg.sender) > _nextLevelExp(levels[tokenId]) * LEVEL_UP_COST_MULTIPLIER, "Insufficient FRXST");
        require(frxst.balanceOf(msg.sender) > (levels[tokenId]+1) * LEVEL_UP_COST_MULTIPLIER, "Insufficient FRXST");//100*2 = 200
        frxst.burn(_msgSender(), (levels[tokenId]+1) * LEVEL_UP_COST_MULTIPLIER* 1 ether);// changes made here.
        experience[tokenId] -= _nextLevelExp(levels[tokenId]);
        levels[tokenId] += 1;
    }

    // lev 1 : 1*1* 10 = 10
    function _nextLevelExp(uint8 level) internal pure returns (uint) {
        return level * level * 10;
    }

    function addManyToPalace(address account, uint[] memory tokenIds, uint8 activityId) external {
        require (activityId < 3, "Not valid activity id");
        require(account == _msgSender() || _msgSender() == address(yeti), "DONT GIVE YOUR TOKENS AWAY");
        for (uint i = 0; i < tokenIds.length; i++) {
            require (initiateGame[tokenIds[i]]==true,'Game Not Initiated');
            require(fighters[tokenIds[i]].tokenId != tokenIds[i], "Reverting, trying to stake already fighting yeti");
            require(palace[tokenIds[i]].tokenId != tokenIds[i], "Reverting, trying to stake already staked yeti");
            require(hospital[tokenIds[i]].tokenId != tokenIds[i], "Reverting, trying to stake injured yeti");
            uint index = RandomnessEngine.getCurrentIndex();
            randomIndex[tokenIds[i]] = initGame(index);
            if (_msgSender() != address(yeti)) { // dont do this step if its a mint + stake
                require(yeti.ownerOf(tokenIds[i]) == _msgSender(), "AIN'T YO TOKEN");
                yeti.transferFrom(_msgSender(), address(this), tokenIds[i]);
            } else if (tokenIds[i] == 0) {
                continue; // there may be gaps in the array for stolen tokens
            }
            if (levels[tokenIds[i]] == 0) {
                levels[tokenIds[i]] = 1;
                experience[tokenIds[i]] = 0;
            }
            if (activityId == 2) {
                _addYetiToFighting(account, tokenIds[i], activityId);
            } else {
                _addYetiToPalace(account, tokenIds[i], activityId);
            }
        }
    }

    function _addYetiToFighting(address account, uint tokenId, uint8 activityId) internal whenNotPaused {

        fighterIndices[tokenId] = totalYetiStakedFighting; // Store the location of the Yeti among fighters

        Stake memory fs = Stake({
        owner: account,
        tokenId: uint16(tokenId),
        activityId: activityId,
        value: uint80(block.timestamp),
        stakeTime: uint80(block.timestamp)
        });

        fighters[tokenId] = fs;

        fighterArray.push(fs);

        fighterIndices[tokenId] = fighterArray.length - 1;
        totalYetiStakedFighting += 1;

        emit TokenStaked(account, tokenId, activityId, block.timestamp);
    }

    function _addYetiToPalace(address account, uint tokenId, uint8 activityId) internal whenNotPaused {

        palace[tokenId] = Stake({
        owner: account,
        tokenId: uint16(tokenId),
        activityId: activityId,
        value: uint80(block.timestamp),
        stakeTime: uint80(block.timestamp)
        });

        if (activityId == 0) {
            totalYetiStakedGathering += 1;
        } else if (activityId == 1) {
            totalYetiStakedHunting += 1;
        }

        emit TokenStaked(account, tokenId, activityId, block.timestamp);
    }

    function ClaimSickYeti(uint tokenId) public {
        _claimYetiFromHospital(tokenId, false);
    }

    function onERC721Received(
        address,
        address from,
        uint,
        bytes calldata
    ) external pure override returns (bytes4) {
        require(from == address(0x0), "Cannot send tokens to Palace directly");
        return IERC721Receiver.onERC721Received.selector;
    }

    function claimMany(uint16[] calldata tokenIds, bool unstake) external whenNotPaused {
        uint owed = 0;
        for (uint i = 0; i < tokenIds.length; i++) {
            require (initiateGame[tokenIds[i]]==true,'Game Not Initiated');
            require(fighters[tokenIds[i]].tokenId == tokenIds[i] || palace[tokenIds[i]].tokenId == tokenIds[i], "Yeti is not staked and can therefore not be claimed.");
            owed += _claimYeti(tokenIds[i], unstake);
        }
        require(owed > 0, "Claiming before 1 day");
        frxst.mint(_msgSender(), owed);
    }

    function random(uint seed) internal view returns (uint) {
        return uint(keccak256(abi.encodePacked(
                tx.origin,
                blockhash(block.number - 1),
                block.timestamp,
                seed
            )));
    }

    function _payYetiTax(uint amount) internal {
        // Mint on sender or contract
        frxst.mint(treasury, amount);
    }

    function heal_cost(uint tokenId) internal returns (uint) {
        return levels[tokenId]**2*100 ;
    }

    function Heal(uint tokenId) external {
        require (initiateGame[tokenId]==true,'Game Not Initiated');
        require(hospital[tokenId].value + INJURY_TIME > block.timestamp, "YOU ARE NOT INJURED");
            if (frxst.transferFrom(msg.sender, treasury, heal_cost(tokenId))) {
                _claimYetiFromHospital(tokenId, true);
                emit Healing(tokenId, msg.sender, HEALING_COST);
            }
    }

    function setPaused(bool _paused) external onlyOwner {
        if (_paused) _pause();
        else _unpause();
    }

    function _claimYetiFromHospital(uint tokenId, bool healed) internal {
        InjuryStake memory stake = hospital[tokenId];
        require(stake.owner == _msgSender(), "SWIPER, NO SWIPING");
        uint val = block.timestamp - stake.value;
        console.log(val);
        require(healed || (block.timestamp - stake.value > INJURY_TIME), "Yeti not healed yet!");
        yeti.safeTransferFrom(address(this), _msgSender(), tokenId, "");
        delete hospital[tokenId];
    }

    //changes made: public to internal
    function _claimYetiFromPalace(uint tokenId, bool unstake) internal returns (uint owedFrxst) {
        Stake memory stake = palace[tokenId];
        require(stake.owner == _msgSender(), "SWIPER, NO SWIPING");
        require (initiateGame[tokenId]==true,'Game Not Initiated');
        require(!( unstake && block.timestamp - stake.value < MINIMUM_TO_EXIT ), "Need two days of Frxst before claiming");
        uint c = tokenRarity[tokenId];
        uint hourly;
        if (stake.activityId == 1) {
            hourly = (rates[c][stake.activityId] * levels[tokenId])* 200; // 180*200
        } else {
            hourly = (rates[c][stake.activityId] * levels[tokenId]) * 100;
        }
        if (unstake){
            //todo change this to 1 days in mainnted
            uint mod = (block.timestamp - stake.value) / 10;
            owedFrxst =  (hourly * mod* 1 ether) / 100;
            //todo change to 10 to 1 days
            uint owedExp = ((block.timestamp - stake.stakeTime)/10)* exprates[stake.activityId];
            if (stake.activityId == 0) {
                // Pay Tax 50%
                initGame storage init = randomIndex[tokenId];
                uint rand = RandomnessEngine.initiateRandomness(tokenId,init.randomValue);
                require (rand > 0 , "Randomness not received");
                init.randomValue = RandomnessEngine.getCurrentIndex();
                if (rand % 100 < GATHERING_TAX_RISK_PERCENTAGE)
                {
                    uint amountToPay = GATHERING_FRXST_TAX_PERCENTAGE - levels[tokenId] * 5;
                    _payYetiTax(owedFrxst * amountToPay / 100);
                    owedFrxst = owedFrxst * (100 - amountToPay) / 100; // remainder goes to Yeti owner
                }
                yeti.safeTransferFrom(address(this), _msgSender(), tokenId, ""); // send back Yeti
                if (experience[tokenId] < (levels[tokenId] ** 2) * 10){
                    if(owedExp > (levels[tokenId] ** 2) * 10){
                        owedExp = (levels[tokenId] ** 2) * 10 - experience[tokenId];
                    }
                    experience[tokenId] += owedExp;
                }
            }

            // Check Injury
            else if (stake.activityId == 1) {
                uint chanceOfInjury = HUNTING_INJURY_RISK_PERCENTAGE - levels[tokenId] * 5;
                initGame storage init = randomIndex[tokenId];
                uint rand = RandomnessEngine.initiateRandomness(tokenId,init.randomValue);
                require (rand>0,"Randomness not received");
                init.randomValue = RandomnessEngine.getCurrentIndex();
            if (rand % 100 < chanceOfInjury ) {
                hospital[tokenId] = InjuryStake({
                    owner: _msgSender(),
                    tokenId: uint16(tokenId),
                    value: uint80(block.timestamp)
                    });
                    emit Injury(tokenId, uint80(block.timestamp));
                } else {
                    yeti.safeTransferFrom(address(this), _msgSender(), tokenId, "");
                    if (experience[tokenId] < (levels[tokenId] ** 2) * 10){
                        if(owedExp > (levels[tokenId] ** 2) * 10){
                            owedExp = (levels[tokenId] ** 2) * 10 - experience[tokenId];
                        }
                        experience[tokenId] += owedExp;
                }
                }
                totalYetiStakedHunting -= 1;
            }
            delete palace[tokenId];

        }
        else {
            //todo change this to 1 days in mainnted
            uint mod = (block.timestamp - stake.value) / 10;
            owedFrxst =  (hourly * mod* 1 ether) / 100;
            _payYetiTax(owedFrxst * GENERAL_FRXST_TAX_PERCENTAGE / 100);
            owedFrxst = owedFrxst * (100 - GENERAL_FRXST_TAX_PERCENTAGE) / 100;

            palace[tokenId] = Stake({
            owner: _msgSender(),
            tokenId: uint16(tokenId),
            activityId: stake.activityId,
            value: uint80(block.timestamp),
            stakeTime: stake.stakeTime
            });
        }
        emit YetiClaimed(tokenId, owedFrxst, unstake);
    }

    function _claimYetiFromFighting(uint tokenId, bool unstake) internal returns (uint owedFrxst) {
        Stake memory stake = fighters[tokenId];
        require (initiateGame[tokenId]==true,'Game Not Initiated');
        require(stake.owner == _msgSender(), "SWIPER, NO SWIPING");
        require(!(unstake && block.timestamp - stake.value < MINIMUM_TO_EXIT), "GONNA BE COLD WITHOUT TWO DAY'S FROST");
        uint hourly = (rates[tokenRarity[tokenId]][stake.activityId]* levels[tokenId]) * levels[tokenId] * 100;
        // rates[2][2]* 400 = 140 * 400 = 56000
        console.log("Hourly:-",hourly);
        if (unstake) {
            //todo change 10 to 1 days
            uint mod = (block.timestamp - stake.value) / 10;
            console.log("Mod:-",mod);
            owedFrxst =  (hourly * mod* 1 ether) / 100;
            console.log("OwedFrxst:-",owedFrxst);
            //todo change to 10 to 1 days
            uint owedExp = ((block.timestamp - stake.stakeTime)/10)* exprates[stake.activityId];
            initGame storage init = randomIndex[tokenId];
            uint rand = RandomnessEngine.initiateRandomness(tokenId,init.randomValue);
            require (rand > 0,"Randomness not received");
            Stake memory lastStake = fighterArray[fighterArray.length - 1];
            if (experience[tokenId] < (levels[tokenId] ** 2) * 10){
                if(owedExp > (levels[tokenId] ** 2) * 10){
                    owedExp = (levels[tokenId] ** 2) * 10 - experience[tokenId];
                }
                experience[tokenId] += owedExp;
            }

            if (rand % 100 < FIGHTING_STOLEN_RISK_PERCENTAGE) { //changes made here
                init.randomValue = RandomnessEngine.getCurrentIndex();
                address recipient = selectRecipient(uint(keccak256(abi.encodePacked(rand,'constantValue'))));
                yeti.safeTransferFrom(address(this), recipient, tokenId, "");
                emit Stolen(tokenId);
            } else {
                yeti.safeTransferFrom(address(this), msg.sender, tokenId, "");
            }
            fighterArray[fighterIndices[tokenId]] = lastStake; // Shuffle last Yeti to current position
            fighterIndices[lastStake.tokenId] = fighterIndices[tokenId];
            fighterArray.pop(); // Remove duplicate
            delete fighterIndices[tokenId]; // Delete old mapping
            delete fighters[tokenId]; // Delete old mapping
            totalYetiStakedFighting -= 1;
            delete fighters[tokenId];
        } else {
            //todo change to 1 days
            uint mod = (block.timestamp - stake.value) / 10 ;
            owedFrxst =  (hourly * mod* 1 ether) / 100;
            uint owedExp = mod * exprates[stake.activityId];
            _payYetiTax(owedFrxst * GENERAL_FRXST_TAX_PERCENTAGE / 100);
            owedFrxst = owedFrxst * (100 - GENERAL_FRXST_TAX_PERCENTAGE) / 100;
            fighters[tokenId] = Stake({
            owner: _msgSender(),
            tokenId: uint16(tokenId),
            activityId: stake.activityId,
            value: uint80(block.timestamp),
            stakeTime: stake.stakeTime
            });
        }
        emit YetiClaimed(tokenId, owedFrxst, unstake);
    }

    function _claimYeti(uint tokenId, bool unstake) internal returns (uint owedFrxst) {

        if (fighters[tokenId].tokenId != tokenId) {
            return _claimYetiFromPalace(tokenId, unstake);
        } else {
            return _claimYetiFromFighting(tokenId, unstake);
        }
    }

    function selectRecipient(uint seed) internal view returns (address) {
        address thief = randomYetiFighter(seed); // 144 bits reserved for trait selection
        if (thief == address(0x0)) return _msgSender();
        return thief;
    }

    function randomYetiFighter(uint seed) internal view returns (address) {
        require(fighterArray.length>0, "Array Size 0"); //require statement added here
        if (totalYetiStakedFighting == 0) return address(0x0);
        console.log(fighterArray.length);
        return fighterArray[seed % fighterArray.length].owner;
    }

    /**
  * emergency unstake tokens
  * @param tokenIds the IDs of the tokens to claim earnings from
    */

    function rescue(uint[] calldata tokenIds) external {
        require(rescueEnabled, "RESCUE DISABLED");
        uint tokenId;
        Stake memory stake;
        Stake memory lastStake;

        for (uint i = 0; i < tokenIds.length; i++) {
            require (initiateGame[i]==true,'Game Not Initiated');
            tokenId = tokenIds[i];
            if (fighters[tokenId].tokenId != tokenId) {
                stake = palace[tokenId];
                require(stake.owner == _msgSender(), "SWIPER, NO SWIPING");
                yeti.safeTransferFrom(address(this), _msgSender(), tokenId, ""); // send back Yeti
                delete palace[tokenId];
                if (stake.activityId == 1) {
                    totalYetiStakedGathering -= 1;
                } else {
                    totalYetiStakedHunting -= 1;
                }
                emit YetiClaimed(tokenId, 0, true);
            } else {
                stake = fighterArray[fighterIndices[tokenId]];
                require(stake.owner == _msgSender(), "SWIPER, NO SWIPING");
                yeti.safeTransferFrom(address(this), _msgSender(), tokenId, ""); // Send back Yeti
                lastStake = fighterArray[fighterArray.length - 1];
                totalYetiStakedFighting -= 1;
                fighters[fighterIndices[tokenId]] = lastStake; // Shuffle last Yeti to current position
                fighterIndices[lastStake.tokenId] = fighterIndices[tokenId];
                fighterArray.pop(); // Remove duplicate
                delete fighterIndices[tokenId]; // Delete old mapping
                delete fighters[tokenId]; // Delete old mapping
                emit YetiClaimed(tokenId, 0, true);
            }
        }
    }
}