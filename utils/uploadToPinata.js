const pinataSDK = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;
const pinata = pinataSDK(pinataApiKey, pinataApiSecret);
// require("dotenv").config();

async function storeImages(imagesFilePath) {
  const fullImagesPath = path.resolve(imagesFilePath);
  const files = fs.readdirSync(fullImagesPath);
  console.log(files);
  let responses = [];
  console.log("Uploading images to IPFS!");
  for (fileIndex in files) {
    const readableStreamForFile = fs.createReadStream(
      `${fullImagesPath}/${files[fileIndex]}`
    );

    try {
      let response = await pinata.pinFileToIPFS(readableStreamForFile);
      responses.push(response);
    } catch (e) {
      console.log(e);
    }
  }
  console.log(responses);
  return { responses, files };
}

async function storeTokenUriMetadata(metadata) {
  try {
    const response = await pinata.pinJSONToIPFS(metadata);
    return response;
  } catch (e) {
    console.log(e);
  }
  return null;
}

module.exports = { storeImages, storeTokenUriMetadata };
