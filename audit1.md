### imports vs usage check <br>
- [x] IERC721Receiver
- [x] Pausable 
- [x] Ownable
- [x] testYetiTown
- [x] testFRXST
- [ ] testRarityStorage
- [ ] Timestamp
- [x] IVRF
- [x] Whitelist 

Comments - 
1. Rarity Storage usage is not required with new rarity
2. Timestamp has not been used and IVRF interface is used instead

### variable declaration

Comments -

Variable declarations need to have better organization for audit purpose;

1. External contract instances need not be public
2. Stake struct does not need tokenId parameter
3. Injury struct does not need tokenId parameter
4. Remove getSignerStore

### event declaration vs usage

- [x] TokenStaked
- [x] YetiClaimed
- [x] Injury
- [x] Stolen
- [x] Healing
- [ ] Log

Comments -
1. Need to add indexed keywords for fields required with filter
2. Injured block actually saves block timestamp, naming could've been better
3. Stolen should include current and new owner information as well
4. Healing cost is not required from event

### Constructor

Comments -
1. rs needs to be removed

### getters declared vs needed

- [ ] GetYetiRarity - has public mapping
- [x] GetYetiOwner - not needed but makes code look cleaner
- [ ] GetYetiInPalace - has public mapping
- [ ] GetYetiInHospital - has public mapping
- [ ] GetGeneralTaxPercentage - is public variable
- [ ] GetInjuryRiskPercentage - is public variable
- [ ] GetStealChance - is public variable
- [ ] GetLevelUpCostMultiplier - is public variable
- [ ] GetExpRates - is public array
- [ ] GetFrxstRates - is public double array
- [ ] GetInjuryTime - is public variable
- [ ] GetMinimumClaimTime - is public variable
- [ ] GetHealingCost - is public variable
- [ ] GetGatherTaxPercentage - is public var
- [ ] GetLevel - is public mapping
- [x] GetLevelModifier 
- [ ] GetExperience - is public mapping
- [x] GetTotalYetiStaked 
- [ ] GetRescueEnabled - is public var

comments - most of these declarations just waste space

### setters

comments - everything looks good here

### functions

#### initiateGameAt 
- type : <br>
  external
- params : <br>
a. array of Struct Rarity <br><br>
Comments - <br>
1. getSignerStore isn't required
2. This function would allow anyone to add rarity if they have signed voucher but not security issue

#### addManyToPalace 
- type : <br>
  external
- params : <br>
a. address account
b. array of uint token Ids
c. uint8 activityId <br><br>
Comments - <br>

1. in initiateGame requirement check, no need to compare bools
2. fighers, palace and hospital mapping can also work by checking empty value of any other variable in the struct, no need to especially store tokenId for this
3. Get current index remains same throughout, no need to call in every iteration, move it outside of loop and just push value inside the loop
4. Why are there gaps in externally called function parameters ? (else if case)
5. Why is there need to reset experience if user is just now initializing (if level 0 -> level 1)


#### addYetiToFighting
Comments - <br>
1. Why do we need array and mapping for same thing ?

#### addYetiToPalace
Comments - <br>
1. Looks good

#### claimMany
Comments - <br>
1. No need to check game initiation check while claiming, uninitiated tokens can't be staked

#### claimYetiFromPalace
Comments - <br>
1. Should've used storage instead of memory for stake
2. No need to check initiate game if it's already staked

#### ClaimYetiFromFighting
1. Should've user storage instead for stake
2. No need to check initiate game if it's already staked
3. selectRecipient call relies on MEV exploitable randomness function - big issue

<br>

Big Comment - Randomness - We don't need 3 separate values for randomness, user can only perform 1 activity per stake
