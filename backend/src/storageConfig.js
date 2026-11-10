const path = require('node:path');

const storageDirectory = process.env.DMS_STORAGE_DIR
  ? path.resolve(process.env.DMS_STORAGE_DIR)
  : path.resolve(__dirname, '../storage');

const configuredLimit = Number(process.env.DMS_MAX_FILE_SIZE_BYTES);
const maxFileSizeBytes = Number.isSafeInteger(configuredLimit) && configuredLimit > 0
  ? configuredLimit
  : 10 * 1024 * 1024;

module.exports = { maxFileSizeBytes, storageDirectory };