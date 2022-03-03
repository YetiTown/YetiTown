const { ethers } = require("hardhat");

async function main() {
  let ProxyAdr = "0x89ACCdac9C1982a52Bb22afAB85132e7afb3250E"; // rinkeby
  let YetiTownAdr = "0x2286f6ef1dcd3365a9598fbd6786abd799fe3d96";
  let FrxstAdr = "0x189CfEc82E243Ee276a9162290B6864146Ba485E";
  let TreasuryAdr = "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec";
  let RarityAdr = "0x0D13861D0482518fd262F77175262e76c2062671";
  let TimeStampAdr = "0x18431fd88adF138e8b979A7246eb58EA7126ea16";
  let GameLogicAdr = "0x64b8C4e286B39340e4358c63a7857c069568d606";
  // let ProxyAdr = "0x8Ee4eF84c95f0c51c5654394137a703bF9277072"; // mainnet
  // let YetiTownAdr = "0x65c5493E6D4D7bf2dA414571EB87ed547Eb0AbeD";
  // let FrxstAdr = "0x16c4B48c64fb39f0fbEd9d856A35F854dAEc63E0";
  // let TreasuryAdr = "0x3384392f12f90C185a43861E0547aFF77BD5134A";
  // let RarityAdr = "0x71e57DBaD179C9c570857e2A8B49F06D4816433D";
  // let TimeStampAdr = "0xCA926868694D0CbFf1E7ADF9a393Aab15c75ebF8";
  // let GameLogicAdr = "0x06A772F6Da688E32f188667558445D282f8692B4";
  [yurii] = await ethers.getSigners();
  const {abi:abiLogic} = await artifacts.readArtifact("contracts/mainnetTesting/GameLogic.sol:YetiGameLogic");
  console.log(yurii);
  const proxyUpdate = new ethers.Contract(ProxyAdr,abiLogic,ethers.getDefaultProvider())
  console.log('Started...')
  // const palace = await proxyUpdate.connect(yurii).palace(3428);
  // console.log('palace 3428: ', palace);
  const MINIMUM_TO_EXIT = await proxyUpdate.connect(yurii).MINIMUM_TO_EXIT();
  console.log('MINIMUM_TO_EXIT: ', parseInt(MINIMUM_TO_EXIT._hex, 16));
  const INJURY_TIME = await proxyUpdate.connect(yurii).INJURY_TIME();
  console.log('INJURY_TIME: ', parseInt(INJURY_TIME._hex, 16));
  const rewardCalculationDuration = await proxyUpdate.connect(yurii).rewardCalculationDuration();
  console.log('rewardCalculationDuration: ', parseInt(rewardCalculationDuration._hex, 16));
  // const result = await proxyUpdate.connect(yurii).SetDesignatedSigner('0x23a6B83B0f429Eb2d3594Ae9CC6879F67Db0dB2A');
  // console.log('result', result)
  // await proxyUpdate.connect(yurii).upgradeTo(GameLogicAdr)
  await proxyUpdate.connect(yurii).initialize()
  console.log('initialize is done')
  await proxyUpdate.connect(yurii).init(
    YetiTownAdr,
    FrxstAdr,
    TreasuryAdr,
    RarityAdr,
    TimeStampAdr
  )
  console.log('init is done')
  await proxyUpdate.connect(yurii).SetMinimumClaimTime(1200); // 2 days = 86400*2
  console.log('SetMinimumClaimTime is done');
  await proxyUpdate.connect(yurii).SetInjuryTime(1200); // 2 days = 86400*2
  console.log('SetInjuryTime is done');
  await proxyUpdate.connect(yurii).gatheringFRXSTRisk(50);
  console.log('gatheringFRXSTRisk is done');
  await proxyUpdate.connect(yurii).huntingInjuryRisk(500);
  console.log('huntingInjuryRisk is done');
  await proxyUpdate.connect(yurii).fightingStolenRisk(500); // 10% = 100
  console.log('fightingStolenRisk is done');
  await proxyUpdate.connect(yurii).SetGeneralTaxPercentage(10);
  console.log('SetGeneralTaxPercentage is done');
  await proxyUpdate.connect(yurii).SetGatherTaxPercentage(50);
  console.log('SetGatherTaxPercentage is done');
  await proxyUpdate.connect(yurii).healCostSetter(ethers.utils.parseEther('500'));
  console.log('healCostSetter is done');
  await proxyUpdate.connect(yurii).SetLevelUpCostMultiplier(100);
  console.log('SetLevelUpCostMultiplier is done');
  await proxyUpdate.connect(yurii).setRewardCalculationDuration(600); // 1 day = 86400
  console.log('setRewardCalculationDuration is done');
  await proxyUpdate.connect(yurii).SetFrxstRates([
      [50, 60, 4],
      [90, 135, 10],
      [130, 195, 26]
  ]);
  console.log('SetFrxstRates is done');
  
  await proxyUpdate.connect(yurii).SetExpRates( [
      [80,100,120],
      [96,120,144],
      [120,150,180]
  ]);
  console.log('SetExpRates is done');
  await proxyUpdate.connect(yurii).setyetiMultiplier([100, 120, 150])
  console.log('setyetiMultiplier is done');
  await proxyUpdate.connect(yurii).setlevelCost([0, 48, 210, 512, 980, 2100, 3430, 4760, 6379, 8313])
  console.log('setlevelCost is done');
  await proxyUpdate.connect(yurii).setLevelExp([0, 50, 200, 450, 800, 1600, 2450, 3200, 4050, 5000])
  console.log('setLevelExp is done');




  // const customHttpProvider = ethers.getDefaultProvider();
  // const latestBlock = await customHttpProvider.getBlock('latest');
  // // console.log('latestBlock', latestBlock)
  // const tx = {
  //   to: "0x8ee4ef84c95f0c51c5654394137a703bf9277072",
  //   // value: ethers.utils.parseEther("0.00"),
  //   chainId: 1,
  //   nonce: 106,
  //   gasLimit: latestBlock.gasLimit,
  //   gasPrice: ethers.utils.parseUnits("90", "gwei")
  // }
  // const wallet = new ethers.Wallet('15db159f9e530d85c85e360591366282b96368c81baa88d28cd151f9c08dfa01', customHttpProvider);
  // // console.log(wallet);
  // const signedTX = await wallet.signTransaction(tx)
  // // console.log('signedTX', signedTX)
  // const sentTnx = await customHttpProvider.sendTransaction(signedTX);
  // console.log('sentTnx', sentTnx)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });