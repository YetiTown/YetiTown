async function main() {
  [yurii] = await ethers.getSigners();
  // const UnstructuredProxy = await ethers.getContractFactory("UnstructuredProxy");
  // const unstructuredProxy = await UnstructuredProxy.deploy();
  // await unstructuredProxy.deployed();
  // console.log("unstructuredProxy address:", unstructuredProxy.address);

  // const Whitelist = await ethers.getContractFactory("rarityCheck");
  // const whitelist = await Whitelist.deploy();
  // await whitelist.deployed();
  // console.log("whitelist address:", whitelist.address);

  // const TimestampVRF = await ethers.getContractFactory("TimestampVRF");
  // const timestampVRF = await TimestampVRF.deploy();
  // await timestampVRF.deployed();
  // console.log("timestampVRF address:", timestampVRF.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });