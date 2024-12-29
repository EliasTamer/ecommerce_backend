const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require('uuid')

module.exports = async function saveToStorageAccount(file, containerName) {
    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(
            process.env.AZURE_STORAGE_CONNECTION_STRING
        );

        // get container client (creates container if it doesn't exist)
        const containerClient = blobServiceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists({
            access: 'container' // Changed from 'blob' to 'container'
        });

        // generate unique filename
        const uniqueFileName = `${uuidv4()}-${file.originalname}`;
        const blobClient = containerClient.getBlockBlobClient(uniqueFileName);

        // upload file
        await blobClient.uploadData(file.buffer, {
            blobHTTPHeaders: { 
                blobContentType: file.mimetype
            }
        });

        return blobClient.url;
    } catch (error) {
        console.error('Detailed Azure error:', error.message); // Log the actual error message
        throw new Error(`Failed to upload file to Azure: ${error.message}`);
    }
}