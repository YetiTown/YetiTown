pragma solidity ^0.8.0;

import "./IERC721Receiver.sol";
import "./Pausable.sol";
import "./Ownable.sol";
import "./YetiTown.sol";
import "./FRXST.sol";
import "./RarityStorage.sol";

contract GameLogic is Pausable, Ownable, IERC721Receiver {

    YetiTown public yeti;
    FRXST public frxst;
    RarityStorage public rs;
    address treasury;

    struct Stake {
        uint16 tokenId;
        uint80 value;
        uint8 activityId;
        address owner;
    }

    struct InjuryStake {
        uint16 tokenId;
        uint80 value;
        address owner;
    }

    event TokenStaked(address owner, uint tokenId, uint8 activityId, uint value);
    event YetiClaimed(uint tokenId, uint earned, bool unstaked);
    event Injury(uint tokenId, uint80 injuredblock);
    event Stolen(uint tokenId);
    event Healing(uint tokenId, address healer, uint cost);

    mapping(uint => Stake) public palace;
    mapping(uint => Stake) public fighters;
    Stake[] public fighterArray;
    mapping(uint => uint) public fighterIndices;

    mapping(uint => InjuryStake) public hospital;
    mapping(uint => uint) public experience;
    mapping(uint => uint8) public levels;

    uint public MINIMUM_TO_EXIT = 1 minutes; //?
    uint public INJURY_TIME = 1 minutes;

    uint public GENERAL_FRXST_TAX_PERCENTAGE = 20;
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

    uint[] public exprates = [2,3,6];

    bool public rescueEnabled = false;

    event Log(address, uint16, uint8);

    constructor(address _yeti, address _frxst, address _treasury, address _rs) {
        yeti = YetiTown(_yeti);
        frxst = FRXST(_frxst);
        treasury = _treasury;
        rs = RarityStorage(_rs); 
    }

    // Call from Others
    function GetYetiRarity(uint tokenId) public view returns (uint) {
        return rs.GetRarity(tokenId);
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
    // function SetRates(uint[3] calldata gathering, uint[3] calldata hunting, uint[3] calldata fighting) external onlyOwner {
    //     rates[0] = gathering;
    //     rates[1] = hunting;
    //     rates[2] = fighting;
    // }
    function SetRescueEnabled(bool _rescue) external onlyOwner {
        rescueEnabled = _rescue;
    }


    // Game Functionality
    function _addExp(uint tokenId, uint amount) internal {
        experience[tokenId] += amount;
    }

    function levelup(uint tokenId) external whenNotPaused {
        require(fighters[tokenId].tokenId != tokenId, "Can't level up while fighting");
        require(palace[tokenId].tokenId != tokenId, "Can't level up while staked");
        require(hospital[tokenId].tokenId != tokenId, "Can't level up while injured");
        require(experience[tokenId] > _nextLevelExp(levels[tokenId]));
        require(levels[tokenId] > 0 && levels[tokenId] < 10);
        require(frxst.balanceOf(msg.sender) > _nextLevelExp(levels[tokenId]) * LEVEL_UP_COST_MULTIPLIER, "Insufficient FRXST");

        frxst.burn(_msgSender(), _nextLevelExp(levels[tokenId]) * LEVEL_UP_COST_MULTIPLIER);
        experience[tokenId] -= _nextLevelExp(levels[tokenId]);
        levels[tokenId] += 1;
    }

    function _nextLevelExp(uint8 level) internal pure returns (uint) {
        return level * level * 10;
    }


    function addManyToPalace(address account, uint[] memory tokenIds, uint8 activityId) external {

        require(account == _msgSender() || _msgSender() == address(yeti), "DONT GIVE YOUR TOKENS AWAY");
        for (uint i = 0; i < tokenIds.length; i++) {
            require(fighters[tokenIds[i]].tokenId != tokenIds[i], "Reverting, trying to stake already fighting yeti");
            require(palace[tokenIds[i]].tokenId != tokenIds[i], "Reverting, trying to stake already staked yeti");
            require(hospital[tokenIds[i]].tokenId != tokenIds[i], "Reverting, trying to stake injured yeti");
            if (_msgSender() != address(yeti)) { // dont do this step if its a mint + stake
                require(yeti.ownerOf(tokenIds[i]) == _msgSender(), "AINT YO TOKEN");
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
        
        fighterIndices[tokenId] = totalYetiStakedFighting - 1; // Store the location of the Yeti among fighters

        Stake memory fs = Stake({
            owner: account,
            tokenId: uint16(tokenId),
            activityId: activityId,
            value: uint80(block.timestamp)
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
        value: uint80(block.timestamp) // time of staking
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
            require(fighters[tokenIds[i]].tokenId == tokenIds[i] || palace[tokenIds[i]].tokenId == tokenIds[i], "Yeti is not staked and can therefore not be claimed.");
            owed += _claimYeti(tokenIds[i], unstake);
        }
        if (owed == 0) return;
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

    function Heal(uint tokenId) external {
        require(hospital[tokenId].value + INJURY_TIME > block.timestamp, "YOU ARE NOT INJURED");
        if (frxst.transferFrom(msg.sender, treasury, HEALING_COST)) {
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
        require(!(healed && block.timestamp - stake.value < INJURY_TIME), "Yeti not healed yet!");
        yeti.safeTransferFrom(address(this), _msgSender(), tokenId, "");
        delete hospital[tokenId];
    }

    function _claimYetiFromPalace(uint tokenId, bool unstake) public returns (uint owedFrxst) {
        Stake memory stake = palace[tokenId];
        require(stake.owner == _msgSender(), "SWIPER, NO SWIPING");
        require(!(unstake && block.timestamp - stake.value < MINIMUM_TO_EXIT), "Need two days of Frxst before claiming");
        uint c = rs.GetRarity(tokenId);
        uint hourly;

        if (stake.activityId == 1) {
            hourly = rates[stake.activityId][c] * GetLevelModifier(levels[tokenId]) * 20;
        } else {
            hourly = rates[stake.activityId][c] * GetLevelModifier(levels[tokenId]) * 10;
        } 
        
        uint mod = (block.timestamp - stake.value) / 1 days;

        owedFrxst =  (hourly * mod) / 100;
        uint owedExp = mod * exprates[stake.activityId];

        //uint owedExp = mod * GetExpActivityRate(stake.activityId);

        if (unstake) {
            if (stake.activityId == 0) {
                // Pay Tax 50%
                if (random(tokenId) % 100 < GATHERING_TAX_RISK_PERCENTAGE) {
                uint amountToPay = GATHERING_FRXST_TAX_PERCENTAGE - levels[tokenId] * 5;
                _payYetiTax(owedFrxst * amountToPay / 100);
                owedFrxst = owedFrxst * (100 - amountToPay) / 100; // remainder goes to Yeti owner 
                }
                yeti.safeTransferFrom(address(this), _msgSender(), tokenId, ""); // send back Yeti
                totalYetiStakedGathering -= 1;
            }

            // Check Injury
            else if (stake.activityId == 1) {
                uint chanceOfInjury = HUNTING_INJURY_RISK_PERCENTAGE - levels[tokenId] * 5;
                if (random(tokenId) % 100 < chanceOfInjury) {
                    hospital[tokenId] = InjuryStake({
                        owner: _msgSender(),
                        tokenId: uint16(tokenId),
                        value: uint80(block.timestamp)
                    });
                    emit Injury(tokenId, uint80(block.timestamp));
                } else {
                yeti.safeTransferFrom(address(this), _msgSender(), tokenId, "");
               
                }
                totalYetiStakedHunting -= 1;
            }

        experience[tokenId] += owedExp;
        delete palace[tokenId];

        }
        else {
        _payYetiTax(owedFrxst * GENERAL_FRXST_TAX_PERCENTAGE / 100); 
        owedFrxst = owedFrxst * (100 - GENERAL_FRXST_TAX_PERCENTAGE) / 100;

        palace[tokenId] = Stake({
            owner: _msgSender(),
            tokenId: uint16(tokenId),
            activityId: stake.activityId,
            value: uint80(block.timestamp)
        });

        }
        emit YetiClaimed(tokenId, owedFrxst, unstake);
    }

    function _claimYetiFromFighting(uint tokenId, bool unstake) internal returns (uint owedFrxst) {
        Stake memory stake = fighters[tokenId];
        require(stake.owner == _msgSender(), "SWIPER, NO SWIPING");
        require(!(unstake && block.timestamp - stake.value < MINIMUM_TO_EXIT), "GONNA BE COLD WITHOUT TWO DAY'S FROST");
        uint c = rs.GetRarity(tokenId);
        uint hourly = rates[stake.activityId][c] * levels[tokenId] * (levels[tokenId]) * 100;
     
        uint mod = (block.timestamp - stake.value) / 1 days;
        
        owedFrxst =  (hourly * mod) / 100;
        uint owedExp = mod * exprates[stake.activityId];

        if (unstake) {
            yeti.safeTransferFrom(address(this), _msgSender(), tokenId, ""); // Send back Yeti
            Stake memory lastStake = fighterArray[fighterArray.length - 1];
            fighterArray[fighterIndices[tokenId]] = lastStake; // Shuffle last Yeti to current position
            fighterIndices[lastStake.tokenId] = fighterIndices[tokenId];
            fighterArray.pop(); // Remove duplicate
            delete fighterIndices[tokenId]; // Delete old mapping
            delete fighters[tokenId]; // Delete old mapping
            experience[tokenId] += owedExp;
            uint chanceOfStolen = FIGHTING_STOLEN_RISK_PERCENTAGE - levels[tokenId];

            if (random(tokenId) % 100 < chanceOfStolen) {
   
                uint seed = random(yeti.NextTokenId());
                address recipient = selectRecipient(seed);
                yeti.safeTransferFrom(address(this), recipient, tokenId, "");
                
                emit Stolen(tokenId);
            } else {
                yeti.safeTransferFrom(address(this), _msgSender(), tokenId, "");
            }

        totalYetiStakedFighting -= 1;  
        delete fighters[tokenId];

        } else {
        _payYetiTax(owedFrxst * GENERAL_FRXST_TAX_PERCENTAGE / 100); 
        owedFrxst = owedFrxst * (100 - GENERAL_FRXST_TAX_PERCENTAGE) / 100;

        fighters[tokenId] = Stake({
            owner: _msgSender(),
            tokenId: uint16(tokenId),
            activityId: stake.activityId,
            value: uint80(block.timestamp)
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
        if (totalYetiStakedFighting == 0) return address(0x0);
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