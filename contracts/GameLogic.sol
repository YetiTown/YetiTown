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

    event TokenStaked(address owner, uint256 tokenId, uint8 activityId, uint256 value);
    event YetiClaimed(uint256 tokenId, uint256 earned, bool unstaked);
    event Injury(uint256 tokenId, uint80 injuredblock);
    event Stolen(uint256 tokenId);
    event Healing(uint256 tokenId, address healer, uint256 cost);

    mapping(uint256 => Stake) public palace;
    mapping(uint256 => Stake) public fighters;
    Stake[] public fighterArray;
    mapping(uint256 => uint256) public fighterIndices;

    mapping(uint256 => InjuryStake) public hospital;
    mapping(uint256 => uint256) public experience;
    mapping(uint256 => uint8) public levels;
    
    uint256 public MINIMUM_TO_EXIT = 1 minutes; //2 days;
    uint256 public INJURY_TIME = 1 minutes; //2 days;

    uint256 public GENERAL_FRXST_TAX_PERCENTAGE = 20;
    uint256 public GATHERING_FRXST_TAX_PERCENTAGE = 50;
    
    uint256 public GATHERING_TAX_RISK_PERCENTAGE = 50;
    uint256 public HUNTING_INJURY_RISK_PERCENTAGE = 50;
    uint256 public FIGHTING_STOLEN_RISK_PERCENTAGE = 10;
    
    uint256 public HEALING_COST = 500 * 1e18;
    uint256 public LEVEL_UP_COST_MULTIPLIER = 100;
    uint256 public totalFrxstEarned = 0;

    uint256 public totalYetiStakedGathering;
    uint256 public totalYetiStakedHunting;
    uint256 public totalYetiStakedFighting;

    uint256[][] public rates = [
        [60, 50, 40],
        [70, 90, 80],
        [100, 120, 140]
    ];

    uint256[] public exprates = [2,3,6];


    bool public rescueEnabled = false;

    event Log(address, uint16, uint8);


    constructor(address _yeti, address _frxst, address _treasury, address _rs) {
        yeti = YetiTown(_yeti);
        frxst = FRXST(_frxst);
        treasury = _treasury;
        rs = RarityStorage(_rs); 
    }


    // Call from Others
    function GetYetiRarity(uint256 tokenId) public view returns (uint256) {
        return rs.GetRarity(tokenId);
    }

    function GetYetiOwner(uint256 tokenId) public view returns (address) {
        return yeti.ownerOf(tokenId);
    }

    // Getters
    function GetYetiInPalace(uint256 tokenId) public view returns (Stake memory) {
        return palace[tokenId];
    }

    function GetYetiInHospital(uint256 tokenId) public view returns (InjuryStake memory) {
        return hospital[tokenId];
    }

    function GetGeneralTaxPercentage() public view returns (uint256) {
        return GENERAL_FRXST_TAX_PERCENTAGE;
    }

    function GetInjuryRiskPercentage() public view returns (uint256) {
        return HUNTING_INJURY_RISK_PERCENTAGE;
    }

    function GetStealChance() public view returns (uint256) {
        return FIGHTING_STOLEN_RISK_PERCENTAGE;
    }

    function GetLevelUpCostMultiplier() public view returns (uint256) {
        return LEVEL_UP_COST_MULTIPLIER;
    }

    function GetExpRates() public view returns (uint256[] memory) {
        return exprates;
    }

    function GetFrxstRates() public view returns (uint256[][] memory) {
        return rates;
    }

    function GetInjuryTime() public view returns (uint256) {
        return INJURY_TIME;
    }

    function GetMinimumClaimTime() public view returns (uint256) {
        return MINIMUM_TO_EXIT;
    }

    function GetHealingCost() public view returns (uint256) {
        return LEVEL_UP_COST_MULTIPLIER;
    }

    function GetGatherTaxPercentage() public view returns (uint256) {
        return GATHERING_FRXST_TAX_PERCENTAGE;
    }

    function GetLevel(uint tokenId) public view returns (uint8) {
        return levels[tokenId];
    }

    function GetLevelModifier(uint8 level) public pure returns (uint256) {
        return level + 10;
    }

    function GetExperience(uint256 tokenId) public view returns (uint256) {
        return experience[tokenId];
    }

    function GetTotalYetiStaked() public view returns (uint256) {
        return totalYetiStakedGathering + totalYetiStakedHunting + totalYetiStakedFighting;
    }
    function GetRescueEnabled() public view returns (bool) {
        return rescueEnabled;
    }



    // Setters 
    function SetFrxstRates(uint256[][] memory _rates) public onlyOwner {
        rates = _rates;
    }
    function SetGeneralTaxPercentage(uint256 _tax) external onlyOwner {
        GENERAL_FRXST_TAX_PERCENTAGE = _tax;
    }
    function SetGatherTaxPercentage(uint256 _tax) external onlyOwner {
        GATHERING_FRXST_TAX_PERCENTAGE = _tax;
    }
    function SetHuntingInjuryPercentage(uint256 _injuryrisk) external onlyOwner {
        HUNTING_INJURY_RISK_PERCENTAGE = _injuryrisk;
    }
    function SetFightingStealPercentage(uint256 _stealrisk) external onlyOwner {
        FIGHTING_STOLEN_RISK_PERCENTAGE = _stealrisk;
    }
    function SetLevelUpCostMultiplier(uint256 _multiplier) external onlyOwner {
        LEVEL_UP_COST_MULTIPLIER = _multiplier;
    }
    function SetExpRates(uint256[] memory _exprates) external onlyOwner {
        exprates = _exprates;
    }

    // In days
    function SetInjuryTime(uint256 _seconds) external onlyOwner {
        INJURY_TIME = _seconds;
    }
    // In days
    function SetMinimumClaimTime(uint256 _seconds) external onlyOwner {
        MINIMUM_TO_EXIT = _seconds;
    }
    

    // In ether
    function SetHealingCost(uint256 _healingcost) external onlyOwner {
        LEVEL_UP_COST_MULTIPLIER = _healingcost * 1e18;
    }

    function SetRescueEnabled(bool _rescue) external onlyOwner {
        rescueEnabled = _rescue;
    }


    // Game Functionality

    function levelup(uint256 tokenId) external whenNotPaused {
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

    function _nextLevelExp(uint8 level) internal pure returns (uint256) {
        return level * level * 10;
    }

    function GetThisAddress() public view returns (address) {
        return address(this);
    }

    function addManyToPalace(address account, uint256[] memory tokenIds, uint8 activityId) external {

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

            //Initialize level to 1 first time they stake
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


    function _addYetiToFighting(address account, uint256 tokenId, uint8 activityId) internal whenNotPaused {
        
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


    function _addYetiToPalace(address account, uint256 tokenId, uint8 activityId) internal whenNotPaused {
        palace[tokenId] = Stake({
        owner: account,
        tokenId: uint16(tokenId),
        activityId: activityId,
        value: uint80(block.timestamp)
        });

        if (activityId == 0) {
        totalYetiStakedGathering += 1;
        } else if (activityId == 1) {
        totalYetiStakedHunting += 1;
        }

        emit TokenStaked(account, tokenId, activityId, block.timestamp);
    }

    function ClaimSickYeti(uint256 tokenId) public {
        _claimYetiFromHospital(tokenId, false);
    }

    function onERC721Received(
        address,
        address from,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        require(from == address(0x0), "Cannot send tokens to Palace directly");
        return IERC721Receiver.onERC721Received.selector;
    }

    function claimMany(uint16[] calldata tokenIds, bool unstake) external whenNotPaused {
        uint256 owed = 0;
        for (uint i = 0; i < tokenIds.length; i++) {
            require(fighters[tokenIds[i]].tokenId == tokenIds[i] || palace[tokenIds[i]].tokenId == tokenIds[i], "Yeti is not staked and can therefore not be claimed.");
            owed += _claimYeti(tokenIds[i], unstake);
        }
        if (owed == 0) return;
        frxst.mint(_msgSender(), owed);
    }

    function random(uint256 seed) internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
        tx.origin,
        blockhash(block.number - 1),
        block.timestamp,
        seed
        )));
    }

    function _payYetiTax(uint256 amount) internal {
        // Mint on sender or contract
        frxst.mint(treasury, amount);
    }

    function Heal(uint256 tokenId) external whenNotPaused {
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

    function _claimYetiFromHospital(uint256 tokenId, bool healed) internal {
        InjuryStake memory stake = hospital[tokenId];
        require(stake.owner == _msgSender(), "SWIPER, NO SWIPING");
        require(!(healed && block.timestamp - stake.value < INJURY_TIME), "Yeti not healed yet!");
        yeti.safeTransferFrom(address(this), _msgSender(), tokenId, "");
        delete hospital[tokenId];
    }

    function _claimYetiFromPalace(uint256 tokenId, bool unstake) public returns (uint256 owedFrxst) {
        Stake memory stake = palace[tokenId];
        require(stake.owner == _msgSender(), "SWIPER, NO SWIPING");
        require(!(unstake && block.timestamp - stake.value < MINIMUM_TO_EXIT), "Need two days of Frxst before claiming");
        uint c = rs.GetRarity(tokenId);
        uint pace;
        uint256 hourly;

        if (c == 0) {
            pace = 100;
        }

        if (stake.activityId == 1) {
            hourly = rates[stake.activityId][c] * GetLevelModifier(levels[tokenId]) * 20;
        } else {
            hourly = rates[stake.activityId][c] * GetLevelModifier(levels[tokenId]) * 10;
        } 
        
        uint256 mod = block.timestamp - stake.value / 1 days;
        
        owedFrxst =  hourly * mod / 100;
        uint256 owedExp = mod * exprates[stake.activityId] * ((c * 50) + 100) / 100;

        if (unstake) {
            if (stake.activityId == 0) {
                // Pay Tax 50%
                if (random(tokenId) % 100 < GATHERING_TAX_RISK_PERCENTAGE) {
                uint256 amountToPay = GATHERING_FRXST_TAX_PERCENTAGE - (levels[tokenId] * 5) + 5;
                _payYetiTax(owedFrxst * amountToPay / 100);
                owedFrxst = owedFrxst * (100 - amountToPay) / 100; // remainder goes to Yeti owner 
                }
                yeti.safeTransferFrom(address(this), _msgSender(), tokenId, ""); // send back Yeti
                totalYetiStakedGathering -= 1;
            }

            // Check Injury
            else if (stake.activityId == 1) {
                uint256 chanceOfInjury = HUNTING_INJURY_RISK_PERCENTAGE - (levels[tokenId] * 5) + 5;
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

        } else {
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

    function _claimYetiFromFighting(uint256 tokenId, bool unstake) internal returns (uint256 owedFrxst) {
        Stake memory stake = fighters[tokenId];
        require(stake.owner == _msgSender(), "SWIPER, NO SWIPING");
        require(!(unstake && block.timestamp - stake.value < MINIMUM_TO_EXIT), "GONNA BE COLD WITHOUT TWO DAY'S FROST");
        uint c = rs.GetRarity(tokenId);
        uint256 hourly = rates[stake.activityId][c] * levels[tokenId] * GetLevelModifier(levels[tokenId]) * 10;
     
        uint256 mod = block.timestamp - stake.value / 1 days;
        
        owedFrxst =  hourly * mod / 100;
        uint256 owedExp = mod * exprates[stake.activityId];

        if (unstake) {
            yeti.safeTransferFrom(address(this), _msgSender(), tokenId, ""); // Send back Yeti
            Stake memory lastStake = fighterArray[fighterArray.length - 1];
            fighterArray[fighterIndices[tokenId]] = lastStake; // Shuffle last Yeti to current position
            fighterIndices[lastStake.tokenId] = fighterIndices[tokenId];
            fighterArray.pop(); // Remove duplicate
            delete fighterIndices[tokenId]; // Delete old mapping
            delete fighters[tokenId]; // Delete old mapping
            experience[tokenId] += owedExp;
            uint256 chanceOfStolen = FIGHTING_STOLEN_RISK_PERCENTAGE - levels[tokenId];

            if (random(tokenId) % 100 < chanceOfStolen) {
   
                uint256 seed = random(yeti.NextTokenId());
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

    function _claimYeti(uint256 tokenId, bool unstake) internal returns (uint256 owedFrxst) {
        
        if (fighters[tokenId].tokenId != tokenId) {
            return _claimYetiFromPalace(tokenId, unstake);
        } else {
            return _claimYetiFromFighting(tokenId, unstake);
        } 
    }

    function selectRecipient(uint256 seed) internal view returns (address) {
        address thief = randomYetiFighter(seed); // 144 bits reserved for trait selection
        if (thief == address(0x0)) return _msgSender();
        return thief;
    }

    function randomYetiFighter(uint256 seed) internal view returns (address) {
        if (totalYetiStakedFighting == 0) return address(0x0);
        return fighterArray[seed % fighterArray.length].owner;
    }

      /**
    * emergency unstake tokens
    * @param tokenIds the IDs of the tokens to claim earnings from
    */
    function rescue(uint256[] calldata tokenIds) external {
        require(rescueEnabled, "RESCUE DISABLED");
        uint256 tokenId;
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