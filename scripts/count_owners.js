const { ethers } = require("hardhat");

async function main() {
  // let ProxyAdr = "0x08e12C5B0EDC2f53BD866573c5Cf1c934d76AE51"; // rinkeby
  // let YetiTownAdr = "0x2286f6ef1dcd3365a9598fbd6786abd799fe3d96";
  // let FrxstAdr = "0x189CfEc82E243Ee276a9162290B6864146Ba485E";
  // let TreasuryAdr = "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec";
  // let RarityAdr = "0x0D13861D0482518fd262F77175262e76c2062671";
  // let TimeStampAdr = "0x18431fd88adF138e8b979A7246eb58EA7126ea16";
  // let GameLogicAdr = "0x64b8C4e286B39340e4358c63a7857c069568d606";
  let ProxyAdr = "0x8Ee4eF84c95f0c51c5654394137a703bF9277072"; // mainnet
  let YetiTownAdr = "0x65c5493E6D4D7bf2dA414571EB87ed547Eb0AbeD";
  // let FrxstAdr = "0x16c4B48c64fb39f0fbEd9d856A35F854dAEc63E0";
  // let TreasuryAdr = "0x3384392f12f90C185a43861E0547aFF77BD5134A";
  // let RarityAdr = "0x71e57DBaD179C9c570857e2A8B49F06D4816433D";
  // let TimeStampAdr = "0xCA926868694D0CbFf1E7ADF9a393Aab15c75ebF8";
  // let GameLogicAdr = "0x06A772F6Da688E32f188667558445D282f8692B4";
  [yurii] = await ethers.getSigners();
  const {abi:abiLogic} = await artifacts.readArtifact("contracts/mainnetTesting/GameLogic.sol:YetiGameLogic");
  const {abi:abiTown} = await artifacts.readArtifact("contracts/mainnetTesting/YetiTown.sol:YetiTown");
  // console.log(yurii);
  const proxyUpdate = new ethers.Contract(ProxyAdr,abiLogic,ethers.getDefaultProvider())
  const yetiTownContract = new ethers.Contract(YetiTownAdr,abiTown,ethers.getDefaultProvider())
  console.log('Started...')
  
  const ownersArray = {};
  for (let tokenId = 1; tokenId <= 4444; tokenId++) {
    try {
      const ownerOf = await yetiTownContract.connect(yurii).ownerOf(tokenId);
      console.log('ownerOf ' + tokenId + ': ', ownerOf);
      if (ownerOf===ProxyAdr) {
        const palace = await proxyUpdate.connect(yurii).palace(tokenId);
        console.log('palace ' + tokenId + ': ', palace['owner']);
        if (palace['tokenId']===tokenId) {
          ownersArray[palace['owner']] = ownersArray[palace['owner']] ? ownersArray[palace['owner']] + 1 : 1;
          continue
        }
        const fighters = await proxyUpdate.connect(yurii).fighters(tokenId);
        console.log('fighters ' + tokenId + ': ', fighters['owner'])
        if (fighters['tokenId']===tokenId) {
          ownersArray[fighters['owner']] = ownersArray[fighters['owner']] ? ownersArray[fighters['owner']] + 1 : 1;
          continue
        }
        const hospital = await proxyUpdate.connect(yurii).hospital(tokenId);
        console.log('hospital ' + tokenId + ': ', hospital['owner']);  
        if (hospital['tokenId']===tokenId) {
          ownersArray[hospital['owner']] = ownersArray[hospital['owner']] ? ownersArray[hospital['owner']] + 1 : 1;
          continue
        }
      } else {
        ownersArray[ownerOf] = ownersArray[ownerOf] ? ownersArray[ownerOf] + 1 : 1;
      }  
    } catch (error) {
      console.log('yeti ' + tokenId + ' does not have an owner');
    }
  }
  console.log(ownersArray);
  // console.log('Total Yetis: ' + ownersArray.reduce((x, y) => x + y));
  console.log('Owners: ' + Object.keys(ownersArray).length);
  const GetTotalYetiStaked = await proxyUpdate.connect(yurii).GetTotalYetiStaked();
  console.log('GetTotalYetiStaked: ', parseInt(GetTotalYetiStaked._hex, 16));
  const totalYetiStakedFighting = await proxyUpdate.connect(yurii).totalYetiStakedFighting();
  console.log('totalYetiStakedFighting: ', parseInt(totalYetiStakedFighting._hex, 16));
  const totalYetiStakedGathering = await proxyUpdate.connect(yurii).totalYetiStakedGathering();
  console.log('totalYetiStakedGathering: ', parseInt(totalYetiStakedGathering._hex, 16));
  const totalYetiStakedHunting = await proxyUpdate.connect(yurii).totalYetiStakedHunting();
  console.log('totalYetiStakedHunting: ', parseInt(totalYetiStakedHunting._hex, 16));
  
  // // checking Yetis by owner address
  // const tokens = await proxyUpdate.connect(yurii).getStakedTokens('0xDc9e2293F7EBCF1043345711e86CE2295140BDdc');
  // console.log('tokens for 0xDc9e2293F7EBCF1043345711e86CE2295140BDdc');
  // for (let i = 0; i < tokens.length; i++) {
  //   const tokenId = parseInt(tokens[i]._hex, 16);
  //   console.log('Token ID: ' + tokenId)
  //   const palace = await proxyUpdate.connect(yurii).palace(tokenId);
    
  //   if (palace['tokenId']===tokenId) {
  //     console.log('In palace ' + tokenId + ': ', palace['owner']);
  //     continue
  //   }
  //   const fighters = await proxyUpdate.connect(yurii).fighters(tokenId);
    
  //   if (fighters['tokenId']===tokenId) {
  //     console.log('fighters ' + tokenId + ': ', fighters['owner'])
  //     continue
  //   }
  //   const hospital = await proxyUpdate.connect(yurii).hospital(tokenId);
    
  //   if (hospital['tokenId']===tokenId) {
  //     console.log('In hospital ' + tokenId + ': ', hospital['owner']);  
  //     continue
  //   }
  // }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });