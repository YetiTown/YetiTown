// const chai = require("chai")
// const { solidity } = require("ethereum-waffle")
// const { artifacts, ethers } = require("hardhat");
//
// chai.use(solidity)
//
// describe("Proxy", function () {
//   it("works", async function () {
//     const Proxy = await ethers.getContractFactory("UnstructuredProxy")
//     const testGameLogic = await ethers.getContractFactory("testGameLogic")
//     const testGameLogicV2 = await ethers.getContractFactory("testGameLogicV2")
//     const [alice, bob] = await ethers.getSigners()
//
//     let YetiTownAdr = "0x323e53bf5C09642ceeE13D82e4095149b75e6104";
//     let FrxstAdr = "0xc17a2F72578B9B80Eee729e265D72b0d0f4fe44a";
//     let TreasuryAdr = "0xe206Fc7Fda4A28A70B6531480353F42C2D10f7C4";
//     let RSAdr = "0x3041cf720E27Ea9090A8B07A69F5d8849e6b26c6";
//     let VRFAdr = "0x0d62eBA54e37A28fE6A576A96b691667b5aac12d";
//
//     const proxy = await Proxy.deploy()
//     const logic = await testGameLogic.deploy()
//     const logicV2 = await testGameLogicV2.deploy()
//
//     await proxy.deployed()
//     await logic.deployed()
//     await logicV2.deployed()
//
//     await proxy.upgradeTo(logic.address)
//
//     chai.expect(await proxy.implementation())
//       .to.equal(logic.address)
//
//     const { abi: abiLogic } = await artifacts.readArtifact("testGameLogic")
//
//     let ProxyUpgraded = new ethers.Contract(proxy.address, abiLogic, ethers.getDefaultProvider());
//     let proxyUpgraded = await ProxyUpgraded.connect(alice)
//
//     await proxyUpgraded.initialize()
//     await proxyUpgraded.init(
//       YetiTownAdr,
//       FrxstAdr,
//       TreasuryAdr,
//       RSAdr,
//       VRFAdr
//       )
//
//     await proxyUpgraded.SetRescueEnabled(true)
//
//     console.log("step1", await proxyUpgraded.GetRescueEnabled())
//
//     await proxyUpgraded.transferOwnership(bob.address)
//
//     await proxy.transferProxyOwnership(bob.address)
//     const proxyWithAlice = await proxy.connect(bob)
//     await proxyWithAlice.upgradeTo(logicV2.address)
//
//     const { abi: abiLogicV2 } = await artifacts.readArtifact("testGameLogicV2")
//
//     ProxyUpgraded = new ethers.Contract(proxy.address, abiLogicV2, ethers.getDefaultProvider());
//     proxyUpgraded = await ProxyUpgraded.connect(bob)
//
//     console.log("step2", await proxyUpgraded.GetRescueEnabled())
//
//     await proxyUpgraded.SetRescueEnabled(false)
//
//     console.log("step3", await proxyUpgraded.GetRescueEnabled())
//
//   })
// })
