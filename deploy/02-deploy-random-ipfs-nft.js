const { network, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const {
  storeImages,
  storeTokenUriMetadata,
} = require("../utils/uploadToPinata");

const imagesLocation = "./images/randomNft";

const metadataTemplate = {
  name: "",
  description: "",
  image: "",
  attributes: [
    {
      trait_type: "Cuteness",
      value: 100,
    },
  ],
};

let tokenUris = [
  "ipfs://QmPsddgwx2s4HE5V9so61eSR3NfGgJMkHgpTRBw1jnmTrH",
  "ipfs://QmYzrvrN5pSqx19qXUCvJm4uau1rcpytPJGzzBkJQDdv82",
  "ipfs://QmPU6NzQQFJKWJ6MukigvnU4D2GWTvcTtSqQu1U735UNqV",
];

const FUND_AMOUNT = ethers.utils.parseEther("30");

// ({ getNamedAccounts, deployments }) == const { getNamedAccounts, deployments } = require("hardhat");
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  let vrfCoordinatorV2Address, subscriptionId;

  if (process.env.UPLOAD_TO_PINATA === "true") {
    tokenUris = await handleTokenUris();
  }
  let vrfCoordinatorV2Mock;
  if (developmentChains.includes(network.name)) {
    vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    const tx = await vrfCoordinatorV2Mock.createSubscription();
    const txReceipt = await tx.wait(1);
    subscriptionId = txReceipt.events[0].args.subId;
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT);
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2Address;
    subscriptionId = networkConfig[chainId].subscriptionId;
  }

  log("-----------------------------");

  const args = [
    vrfCoordinatorV2Address,
    subscriptionId,
    networkConfig[chainId].gasLane,
    networkConfig[chainId].callbackGasLimit,
    tokenUris,
    networkConfig[chainId].mintFee,
  ];

  const randomIpfsNFT = await deploy("RandomIpfsNFT", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  log("--------------------------");
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("verifying...");
    await verify(randomIpfsNFT.address, args);
  }

  if (developmentChains.includes(network.name)) {
    vrfCoordinatorV2Mock.addConsumer(
      subscriptionId.toNumber(),
      randomIpfsNFT.address
    );
  }
};

async function handleTokenUris() {
  tokenUris = [];
  // store the Image in IPFS
  //   store the metadata in IPFS
  const { responses: imageUploadResponses, files } = await storeImages(
    imagesLocation
  );

  for (imageUploadResponseIndex in imageUploadResponses) {
    let tokenUriMetadata = { ...metadataTemplate };
    tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "");
    tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup`;
    tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`;
    console.log(`Uploading tokenURI ${tokenUriMetadata.name}`);
    const metadataUploadResponse = await storeTokenUriMetadata(
      tokenUriMetadata
    );
    tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`);
  }
  console.log("Token URIs Uploaded! They are:");
  console.log(tokenUris);
  return tokenUris;
}

module.exports.tags = ["all", "randomipfs", "main"];
