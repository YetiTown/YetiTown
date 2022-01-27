const { expect } = require("chai");
const { ethers } = require("hardhat");

// describe("Greeter", function () {
//   it("Should return the new greeting once it's changed", async function () {
//     const Greeter = await ethers.getContractFactory("Greeter");
//     const greeter = await Greeter.deploy("Hello, world!");
//     await greeter.deployed();

//     expect(await greeter.greet()).to.equal("Hello, world!");

//     const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

//     // wait until the transaction is mined
//     await setGreetingTx.wait();

//     expect(await greeter.greet()).to.equal("Hola, mundo!");
//   });

// });

async function DeployFrxst() {
  const FRXST = await hre.ethers.getContractFactory("FRXST");
  const frxst = await FRXST.deploy();

  await frxst.deployed();

  console.log("FRXST deployed to:", frxst.address);
  return frxst.address;
}

async function DeployRarityStorage() {
  const RS = await hre.ethers.getContractFactory("RarityStorage");
  const rs = await RS.deploy();

  await rs.deployed();

  console.log("RS deployed to:", rs.address);
  return rs.address;
}

async function DeployYetiTown() {
  const YetiTown = await hre.ethers.getContractFactory("YetiTown");
  const yetiTown = await YetiTown.deploy("YETI", "YETI", "", "");

  await yetiTown.deployed();

  console.log("yetiTown deployed to:", yetiTown.address);
  return yetiTown.address;
}

async function DeployGameLogic(YetiTownAdr, FrxstAdr, TreasuryAdr, RSAdr) {
  const GameLogic = await hre.ethers.getContractFactory("GameLogic");
  const gameLogic = await GameLogic.deploy(
    YetiTownAdr,
    FrxstAdr,
    TreasuryAdr,
    RSAdr
  );

  await gameLogic.deployed();

  console.log("gameLogic deployed to:", gameLogic.address);
  return gameLogic.address;
}


describe("GameLogic", function() {

  it("Initialize..", async function () {
    // Initialize
    TreasuryAdr = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    // FRXST Setup
    FrxstAdr = await DeployFrxst();
    let FRXST = await ethers.getContractFactory("FRXST");
    let frxst = await FRXST.attach(FrxstAdr);

    await frxst.addController(TreasuryAdr);
    await frxst.mint(TreasuryAdr, "100000000000000000000");
    let balance = await frxst.balanceOf(TreasuryAdr);
    expect(await frxst.balanceOf(TreasuryAdr)).to.equal("100000000000000000000");
    
    // RS Setup
    RSAdr = await DeployRarityStorage();
    let RS = await ethers.getContractFactory("RarityStorage");
    let rs = await RS.attach(RSAdr);
    await rs.SetRarities([1,2,3,1,2,3]);
    expect(await rs.GetRarity(5)).to.equal(2);

    // YetiTown Setup
    YetiTownAdr = await DeployYetiTown();
    let YetiTown = await ethers.getContractFactory("YetiTown");
    let yetitown = await YetiTown.attach(YetiTownAdr);
    await yetitown.tresuryMint(TreasuryAdr, 10);
    expect(await yetitown.NextTokenId()).to.equal(11);
    expect(await yetitown.ownerOf(1)).to.equal(TreasuryAdr);

    // GameLogic Setup
    GameLogicAdr = await DeployGameLogic(YetiTownAdr, FrxstAdr, TreasuryAdr, RSAdr);
    let GameLogic = await ethers.getContractFactory("GameLogic");
    let gamelogic = await GameLogic.attach(GameLogicAdr);
    await frxst.addController(GameLogicAdr);
    expect(await gamelogic.GetYetiOwner(1)).to.equal(TreasuryAdr);
    expect(await gamelogic.GetYetiOwner(10)).to.equal(TreasuryAdr);


    await yetitown.approve(GameLogicAdr, 1);
    expect(await yetitown.getApproved(1)).to.equal(GameLogicAdr);
    await yetitown.approve(GameLogicAdr, 2);
    expect(await yetitown.getApproved(2)).to.equal(GameLogicAdr);
    await yetitown.approve(GameLogicAdr, 3);
    expect(await yetitown.getApproved(3)).to.equal(GameLogicAdr);

    await gamelogic.addManyToPalace(TreasuryAdr, [1], 1);
    expect(await gamelogic.GetTotalYetiStaked()).to.equal(1);

    // Does not pass
    let yetip = await gamelogic.GetYetiInPalace(1);
    console.log("yetip", yetip.tokenId);
    expect(yetip.tokenId).to.equal(1);


    // Getters
    expect(await gamelogic.GetGeneralTaxPercentage()).to.equal(20);
    expect(await gamelogic.GetInjuryRiskPercentage()).to.equal(50);
    expect(await gamelogic.GetStealChance()).to.equal(10);
    expect(await gamelogic.GetLevelUpCostMultiplier()).to.equal(100);

    // Does pass
    let exp = await gamelogic.GetExpRates();
    expect(exp[0] == 2);
    expect(exp[1] == 3);
    expect(exp[2] == 6);

    let fr = await gamelogic.GetFrxstRates();
    expect(fr[0][0] == 60);
    expect(fr[0][1] == 50);
    expect(fr[0][2] == 40);
    expect(fr[1][0] == 70);
    expect(fr[1][1] == 90);
    expect(fr[1][2] == 80);
    expect(fr[2][0] == 100);
    expect(fr[2][1] == 120);
    expect(fr[2][2] == 140);


    expect(await gamelogic.GetInjuryTime()).to.equal(60); 
    expect(await gamelogic.GetMinimumClaimTime()).to.equal(60);
    expect(await gamelogic.GetHealingCost()).to.equal(await gamelogic.GetLevelUpCostMultiplier());
    expect(await gamelogic.GetGatherTaxPercentage()).to.equal(50);

    expect(await gamelogic.GetExperience(1)).to.equal(0); //Exp 0
    expect(await gamelogic.GetLevel(1)).to.equal(1); //Lv 1
    expect(await gamelogic.GetLevelModifier(1)).to.equal(11);

    
    let rescue = await gamelogic.GetRescueEnabled();
    console.log("res", rescue);
    expect(rescue === false);

    // Setters
    await gamelogic.SetFrxstRates([
      [120, 100, 200],
      [70, 90, 80],
      [222, 333, 444]
    ]);

    await gamelogic.SetExpRates([11,22,33]);

    let exp2 = await gamelogic.GetExpRates();
    expect(exp2[0] == 11);
    expect(exp2[1] == 22);
    expect(exp2[2] == 33);

    let fr2 = await gamelogic.GetFrxstRates();
    expect(fr2[0][0] == 120);
    expect(fr2[0][1] == 100);
    expect(fr2[0][2] == 200);
    expect(fr2[1][0] == 70);
    expect(fr2[1][1] == 90);
    expect(fr2[1][2] == 80);
    expect(fr2[2][0] == 222);
    expect(fr2[2][1] == 333);
    expect(fr2[2][2] == 444);


    await gamelogic.SetGeneralTaxPercentage(90);
    expect(await gamelogic.GetGeneralTaxPercentage()).to.equal(90);

    await gamelogic.SetGatherTaxPercentage(23);
    expect(await gamelogic.GetGatherTaxPercentage()).to.equal(23);

    await gamelogic.SetHuntingInjuryPercentage(1);
    expect(await gamelogic.GetInjuryRiskPercentage()).to.equal(1);

    await gamelogic.SetFightingStealPercentage(90);
    expect(await gamelogic.GetStealChance()).to.equal(90);

    await gamelogic.SetLevelUpCostMultiplier(23);
    expect(await gamelogic.GetLevelUpCostMultiplier()).to.equal(23);

    await gamelogic.SetInjuryTime(180);
    expect(await gamelogic.GetInjuryTime()).to.equal(180);
    
    await gamelogic.SetMinimumClaimTime(180);
    expect(await gamelogic.GetMinimumClaimTime()).to.equal(180);

    await gamelogic.SetHealingCost(50);
    expect(await gamelogic.GetHealingCost()/1e18).to.equal(50);

    await gamelogic.SetRescueEnabled(true);
    expect(await gamelogic.GetRescueEnabled() === true);

    await gamelogic.claimMany([1], false);
    let balance2 = await frxst.balanceOf(TreasuryAdr);
    console.log("PreBalance", balance);
    console.log("PostBalance", balance2);

  });
})
