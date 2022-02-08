// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {


  // let YetiTownAdr = "0x323e53bf5C09642ceeE13D82e4095149b75e6104";
  // let FrxstAdr = "0xc17a2F72578B9B80Eee729e265D72b0d0f4fe44a";
  // let TreasuryAdr = "0xe206Fc7Fda4A28A70B6531480353F42C2D10f7C4";
  // let RSAdr = "0x3041cf720E27Ea9090A8B07A69F5d8849e6b26c6";
  // let GameLogicAdr = "0x161bAb67CD44ac1625Fb45c4d0BDE24fb9268DD6";

  
  
  // await DeployFrxst(FrxstAdr);
  // const FRXST = await ethers.getContractFactory("FRXST");
  // // const frxst = await FRXST.attach(FrxstAdr);
  
  // await DeployRarityStorage(RSAdr);
  // const RS = await ethers.getContractFactory("RarityStorage");
  // // const rs = await RS.attach(RSAdr);
  
  // await DeployYetiTown(YetiTownAdr);
  // const YetiTown = await ethers.getContractFactory("YetiTown");
  // // const yetitown = await YetiTown.attach(YetiTownAdr);
  
  // const GameLogicAdr = await DeployGameLogic(YetiTownAdr, FrxstAdr, TreasuryAdr, RSAdr);
  // const GameLogic = await ethers.getContractFactory("GameLogic");
  // const gamelogic = await GameLogic.attach(GameLogicAdr);



  // Frxst.Add controller
  //await frxst.addController(TreasuryAdr);

  // Frxst.Mint
  //await frxst.mint(TreasuryAdr, "100000000000000000000");
  // const balance = await frxst.balanceOf(TreasuryAdr);
  // console.log("balance: ", balance);

  // RarityStorage.SetRarities.
  //await rs.SetRarities([1,2,3,1,2,3]);
  //const rarity = await rs.GetRarity(5);
  //console.log(rarity);

  // //YetiTown.MintToTreasury
  //await yetitown.tresuryMint(TreasuryAdr, 10);
  //const next = await yetitown.NextTokenId();
  //console.log("nextTokenId: ", next);
  //const owner = await yetitown.ownerOf(1);
  //console.log("owner", owner);




  // YetiTown.Approve(GameLogic, tokenId);
  //await yetitown.approve(GameLogicAdr, 1);


  // YetiTown.Transfer (from GameLogic)
  // await gamelogic.addManyToPalace(TreasuryAdr, [1], 1);
  // const total = await gamelogic.GetMinimumClaimTime();
  // console.log("Gathering Tax", total.toString());
  await DeployFrxst()


}

async function DeployFrxst() {
  const FRXST = await hre.ethers.getContractFactory("FRXST");
  const frxst = await FRXST.deploy();
  console.log(frxst);
  await frxst.deployed();

  console.log("FRXST deployed to:", frxst.address);
  // FrxstAdr = frxst.address;
}

async function DeployRarityStorage(RSAdr) {
  const RS = await hre.ethers.getContractFactory("RarityStorage");
  const rs = await RS.deploy();

  await rs.deployed();

  console.log("RS deployed to:", rs.address);
  RSAdr = rs.address;
}

async function DeployYetiTown(YetiTownAdr) {
  const YetiTown = await hre.ethers.getContractFactory("YetiTown");
  const yetiTown = await YetiTown.deploy("YETI", "YETI", "", "");

  await yetiTown.deployed();

  console.log("yetiTown deployed to:", yetiTown.address);
  YetiTownAdr = yetiTown.address;
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

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
