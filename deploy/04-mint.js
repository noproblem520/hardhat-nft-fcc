const { ethers, network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts }) => {
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  // Basic NFT
  const basicNFT = await ethers.getContract("BasicNFT", deployer);
  const basicMintTx = await basicNFT.mintNFT();
  await basicMintTx.wait(1);
  console.log(`Basic NFT index 0 has tokenURI: ${await basicNFT.tokenURI(0)}`);

  // Dynamic SVG NFT
  const highValue = ethers.utils.parseEther("4000");
  const dynamicSvgNft = await ethers.getContract("DynamicSvgNFT", deployer);
  const dynamicSvgNftMintTx = await dynamicSvgNft.mintNFT(highValue.toString());
  await dynamicSvgNftMintTx.wait(1);
  console.log(
    `Dynamic SVG NFT index 0 tokenURI: ${await dynamicSvgNft.tokenURI(0)}`
  );

  //   await new Promise(async (resolve, reject) => {
  //     setTimeout(() => reject("Timeout: 'NFTMinted' event did not fire"), 300000); // 5 minute timeout time

  //     randomIpfsNft.once("NFTMinted", async () => {
  //       resolve();
  //     });

  //     const randomIpfsNftMintTx = await randomIpfsNft.requestNFT({
  //       value: mintFee.toString(),
  //     });
  //     const randomIpfsNftMintTxReceipt = await randomIpfsNftMintTx.wait(1);

  //     if (developmentChains.includes(network.name)) {
  //       const requestId =
  //         randomIpfsNftMintTxReceipt.events[1].args.requestId.toString();

  //       const vrfCoordinatorV2Mock = await ethers.getContract(
  //         "VRFCoordinatorV2Mock",
  //         deployer
  //       );
  //       await vrfCoordinatorV2Mock.fulfillRandomWords(
  //         requestId,
  //         randomIpfsNft.address
  //       );
  //     }
  //   });
  //   console.log(
  //     `Random IPFS NFT index 0 tokenURI ${await randomIpfsNft.tokenURI(0)}`
  //   );

  // Random IPFS NFT

  // Random IPFS NFT
  //   const randomIpfsNft = await ethers.getContract("RandomIpfsNFT", deployer);
  //   const mintFee = await randomIpfsNft.getMintFee();
  const randomIpfsNft = await ethers.getContract("RandomIpfsNFT", deployer);
  const mintFee = await randomIpfsNft.getMintFee();
  const randomIpfsNftMintTx = await randomIpfsNft.requestNFT({
    value: mintFee.toString(),
  });
  const randomIpfsNftMintTxReceipt = await randomIpfsNftMintTx.wait(1);
  // Need to listen for response
  await new Promise(async (resolve, reject) => {
    setTimeout(() => reject("Timeout: 'NFTMinted' event did not fire"), 300000); // 5 minute timeout time
    // setup listener for our event
    randomIpfsNft.once("NFTMinted", async () => {
      resolve();
    });
    if (chainId == 31337) {
      const requestId =
        randomIpfsNftMintTxReceipt.events[1].args.requestId.toString();
      const vrfCoordinatorV2Mock = await ethers.getContract(
        "VRFCoordinatorV2Mock",
        deployer
      );
      await vrfCoordinatorV2Mock.fulfillRandomWords(
        requestId,
        randomIpfsNft.address
      );
    }
  });
  console.log(
    `Random IPFS NFT index 0 tokenURI: ${await randomIpfsNft.tokenURI(0)}`
  );
};
module.exports.tags = ["all", "mint"];
