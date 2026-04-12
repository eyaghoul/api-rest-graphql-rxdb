const dbPromise = require('../db');

async function getDevicesByUser(userId) {
  const { devices } = await dbPromise;

  const docs = await devices.find({
    selector: { userId }
  }).exec();

  return docs.map(d => d.toJSON());
}

async function createDevice(data, createId) {
  const { devices, users } = await dbPromise;

  const user = await users.findOne(data.userId).exec();
  if (!user) throw new Error("Utilisateur non trouvé");

  const inserted = await devices.insert({
    id: createId(),
    ...data
  });

  return inserted.toJSON();
}

async function updateDevice({ id, name, type, serialNumber, status }) {
  const { devices } = await dbPromise;

  const doc = await devices.findOne(id).exec();
  if (!doc) return null;

  const updated = await doc.incrementalPatch({
    name,
    type,
    serialNumber,
    status
  });

  return updated.toJSON();
}

async function deleteDevice(id) {
  const { devices } = await dbPromise;

  const doc = await devices.findOne(id).exec();
  if (!doc) return false;

  await doc.remove();
  return true;
}

module.exports = {
  getDevicesByUser,
  createDevice,
  updateDevice,
  deleteDevice
};