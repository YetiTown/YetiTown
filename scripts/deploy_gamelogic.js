async function main() {
  let YetiTownAdr = "0x2286f6ef1dcd3365a9598fbd6786abd799fe3d96";
  let FrxstAdr = "0x189CfEc82E243Ee276a9162290B6864146Ba485E";
  let TreasuryAdr = "0xC849748dcCFefe6E889c00156c782c1Db2ba3A6D";
  let RarityAdr = "0xe3905ECa90e7ffC9cE914C5a423d27ab8EE3e558";
  let TimeStampAdr = "0xFCe4F0FAe2cA084020E220867a787db1E164F50F";
  [yurii] = await ethers.getSigners();
  // console.log(yurii);
  const YetiGameLogic = await ethers.getContractFactory("contracts/mainnetTesting/GameLogic.sol:YetiGameLogic");
  const yetiGameLogic = await YetiGameLogic.deploy();
  await yetiGameLogic.deployed();

  console.log("YetiGameLogic address:", yetiGameLogic.address);

  // const {abi:abiLogic} = await artifacts.readArtifact("contracts/mainnetTesting/GameLogic.sol:YetiGameLogic");
  // const YetiGameLogicContract = new ethers.Contract('0x4BD4156fB860F521D5737cA6a8810AE6142152E5',abiLogic,ethers.getDefaultProvider());
  // await YetiGameLogicContract.connect(yurii).initialize();
  // await YetiGameLogicContract.connect(yurii).init(
  //   YetiTownAdr,
  //   FrxstAdr,
  //   TreasuryAdr,
  //   RarityAdr,
  //   TimeStampAdr
  // );

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });